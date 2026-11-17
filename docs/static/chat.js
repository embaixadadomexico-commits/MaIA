(() => {
  const chat = document.getElementById('maia');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  const selector = document.getElementById('chat-language');
  const submit = form.querySelector('button[type="submit"]');
  const translations = {
    'pt-BR': {
      language: 'Idioma',
      welcome: 'Olá! Sou a MaIA. Como posso ajudar com os serviços consulares?',
      send: 'Enviar',
      input: 'Sua pergunta',
      placeholder: 'Digite sua pergunta',
      log: 'Conversa',
      more: 'Para mais informações: ',
      phone: 'Telefone',
      email: 'Email',
      waiting: 'Estou consultando as informações…',
      unavailable: 'O chat está temporariamente indisponível. Tente novamente mais tarde.',
      empty: 'Não encontrei uma resposta.',
      connection: 'Falha de conexão. Tente novamente.',
    },
    es: {
      language: 'Idioma',
      welcome: '¡Hola! Soy MaIA. ¿En qué puedo ayudarte con los servicios consulares?',
      send: 'Enviar',
      input: 'Tu pregunta',
      placeholder: 'Escribe tu pregunta',
      log: 'Conversación',
      more: 'Para más información: ',
      phone: 'Teléfono',
      email: 'Correo electrónico',
      waiting: 'Estoy consultando la información…',
      unavailable: 'El chat no está disponible temporalmente. Inténtalo más tarde.',
      empty: 'No encontré una respuesta.',
      connection: 'Error de conexión. Inténtalo de nuevo.',
    },
  };

  function updateLanguage() {
    const language = selector.value;
    const copy = translations[language];
    chat.lang = language;
    chat.querySelectorAll('[data-chat-text]').forEach(element => {
      element.textContent = copy[element.dataset.chatText];
    });
    input.setAttribute('aria-label', copy.input);
    input.placeholder = copy.placeholder;
    messages.setAttribute('aria-label', copy.log);
  }

  function appendFormattedText(message, text) {
    for (const part of text.split(/(\*\*[^*\r\n]+\*\*)/)) {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const bold = document.createElement('strong');
        bold.textContent = part.slice(2, -2);
        message.append(bold);
      } else {
        message.append(part);
      }
    }
  }

  function appendContact(message, label, value, kind) {
    const bold = document.createElement('strong');
    bold.textContent = label + ':';
    message.append(bold, ' ');

    const pattern = kind === 'email'
      ? /[A-Z0-9.!#$%&'*+/=?^_{}|~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+/gi
      : /(?:\+?\d|\(\d{2,3}\))(?:[ \u00a0().-]*\d){5,14}\b/g;
    let offset = 0;
    for (const match of value.matchAll(pattern)) {
      const contact = match[0];
      const number = kind === 'phone' ? contact.replace(/\D/g, '') : '';
      if (kind === 'phone' && (number.length < 8 || number.length > 15)) continue;
      message.append(value.slice(offset, match.index));
      const link = document.createElement('a');
      link.href = kind === 'email'
        ? 'mailto:' + contact.replace(/[?#%]/g, encodeURIComponent)
        : 'tel:' + (contact.startsWith('+') ? '+' : '') + number;
      link.textContent = contact;
      message.append(link);
      offset = match.index + contact.length;
    }
    message.append(value.slice(offset));
  }

  function renderAnswer(message, text, source, language) {
    const copy = translations[language];
    let previousWasContact = false;
    let pendingBreak = '';
    for (const line of text.trim().split(/\r?\n/)) {
      if (!line.trim()) {
        if (pendingBreak) pendingBreak = '\n\n';
        continue;
      }
      const contact = /^\s*(?:[-•]\s+)?(?:\*\*)?(telefone|tel[eé]fono|e-?mail|correo(?: electr[oó]nico)?)(?:\*\*)?\s*:(?:\*\*)?\s*(.+)$/i.exec(line);
      if (contact) {
        if (pendingBreak) message.append(previousWasContact ? '\n' : '\n\n');
        const kind = /^tel/i.test(contact[1]) ? 'phone' : 'email';
        const value = contact[2].trim().replace(/\*\*/g, '');
        appendContact(message, copy[kind], value, kind);
      } else {
        message.append(pendingBreak);
        appendFormattedText(message, line);
      }
      previousWasContact = Boolean(contact);
      pendingBreak = '\n';
    }
    if (typeof source !== 'string' || !/^https?:\/\//i.test(source)) return;

    const link = document.createElement('a');
    link.href = source;
    link.textContent = source;
    message.append('\n\n' + copy.more, link);
  }

  function addMessage(text, kind, language, sources) {
    const message = document.createElement('p');
    message.className = 'maia-message maia-' + kind;
    message.lang = language;
    if (sources) renderAnswer(message, text, sources[0], language);
    else message.textContent = text;
    messages.append(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  }

  selector.addEventListener('change', updateLanguage);
  updateLanguage();
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && !event.repeat) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const question = input.value.trim();
    if (question.length < 2 || submit.disabled) return;

    const language = selector.value;
    const copy = translations[language];
    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      addMessage(copy.unavailable, 'bot', language);
      return;
    }

    addMessage(question, 'user', language);
    input.value = '';
    input.disabled = true;
    submit.disabled = true;
    const waiting = addMessage(copy.waiting, 'bot', language);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: question, language}),
      });
      const data = response.ok ? await response.json() : null;
      if (data) {
        addMessage(data.answer || copy.empty, 'bot', language, data.sources || []);
      } else {
        addMessage(copy.unavailable, 'bot', language);
      }
    } catch {
      addMessage(copy.connection, 'bot', language);
    } finally {
      waiting.remove();
      input.disabled = false;
      submit.disabled = false;
      if (document.activeElement === document.body) input.focus();
    }
  });
})();
