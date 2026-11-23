const input = document.getElementById("input-string");
const characterCount = document.getElementById("character-count");
const status = document.getElementById("status");
const results = document.getElementById("results");
const resultsBody = document.getElementById("results-body");
const matchCount = document.getElementById("match-count");

const tablaNaturales = {
  0: { "+": 1, "-": 1, "0123456789": 2, ",": -1 },
  1: { "+": -1, "-": -1, "0123456789": 2, ",": -1 },
  2: { "+": -1, "-": -1, "0123456789": 2, ",": 3 },
  3: { "+": -1, "-": -1, "0123456789": 4, ",": -1 },
  4: { "+": -1, "-": -1, "0123456789": 5, ",": -1 },
  5: { "+": -1, "-": -1, "0123456789": 6, ",": -1 },
  6: { "+": -1, "-": -1, "0123456789": -1, ",": 3 },
  "-1": { "+": -1, "-": -1, "0123456789": -1, ",": -1 }
};
const estadosAceptacionNaturales = [2, 6];

const tablaReales = {
  0: { "-": 1, "+": 1, "0123456789": 2, ".": -1, ",": -1 },
  1: { "-": -1, "+": -1, "0123456789": 2, ".": -1, ",": -1 },
  2: { "-": -1, "+": -1, "0123456789": 2, ".": 3, ",": 5 },
  3: { "-": -1, "+": -1, "0123456789": 4, ".": -1, ",": -1 },
  4: { "-": -1, "+": -1, "0123456789": 4, ".": -1, ",": -1 },
  5: { "-": -1, "+": -1, "0123456789": 6, ".": -1, ",": -1 },
  6: { "-": -1, "+": -1, "0123456789": 7, ".": -1, ",": -1 },
  7: { "-": -1, "+": -1, "0123456789": 8, ".": -1, ",": -1 },
  8: { "-": -1, "+": -1, "0123456789": -1, ".": 3, ",": 5 },
  "-1": { "-": -1, "+": -1, "0123456789": -1, ".": -1, ",": -1 }
};
const estadosAceptacionReales = [4];

const tablaPorcentaje = {
  0: { "-": 1, "+": 1, "0123456789": 2, ".": -1, ",": -1, "%": -1 },
  1: { "-": -1, "+": -1, "0123456789": 2, ".": -1, ",": -1, "%": -1 },
  2: { "-": -1, "+": -1, "0123456789": 2, ".": 8, ",": 4, "%": 3 },
  3: { "-": -1, "+": -1, "0123456789": -1, ".": -1, ",": -1, "%": -1 },
  4: { "-": -1, "+": -1, "0123456789": 5, ".": -1, ",": -1, "%": -1 },
  5: { "-": -1, "+": -1, "0123456789": 6, ".": -1, ",": -1, "%": -1 },
  6: { "-": -1, "+": -1, "0123456789": 7, ".": -1, ",": -1, "%": -1 },
  7: { "-": -1, "+": -1, "0123456789": -1, ".": 8, ",": 4, "%": 3 },
  8: { "-": -1, "+": -1, "0123456789": 9, ".": -1, ",": -1, "%": -1 },
  9: { "-": -1, "+": -1, "0123456789": 9, ".": -1, ",": -1, "%": 3 },
  "-1": { "-": -1, "+": -1, "0123456789": -1, ".": -1, ",": -1, "%": -1 }
};
const estadosAceptacionPorcentaje = [3];

const tablaDinero = {
  0: { "$": 1, "0123456789": -1, ".": -1, ",": -1 },
  1: { "$": -1, "0123456789": 2, ".": -1, ",": -1 },
  2: { "$": -1, "0123456789": 2, ".": 3, ",": 5 },
  3: { "$": -1, "0123456789": 4, ".": -1, ",": -1 },
  4: { "$": -1, "0123456789": 4, ".": -1, ",": -1 },
  5: { "$": -1, "0123456789": 6, ".": -1, ",": -1 },
  6: { "$": -1, "0123456789": 7, ".": -1, ",": -1 },
  7: { "$": -1, "0123456789": 8, ".": -1, ",": -1 },
  8: { "$": -1, "0123456789": -1, ".": 3, ",": 5 },
  "-1": { "$": -1, "0123456789": -1, ".": -1, ",": -1 }
};
const estadosAceptacionDinero = [2, 4, 8];

function ejecutarAFD(matriz, estadosAceptacion, cadenaEntrada) {
  let estado = 0;
  for (let i = 0; i < cadenaEntrada.length; i++) {
    const fila = matriz[estado] || matriz["-1"];
    const clave = Object.keys(fila).find(k => k.includes(cadenaEntrada[i]));
    estado = fila[clave] ?? -1;
  }
  return estadosAceptacion.includes(estado);
}

const automatas = [
  { tipo: "Valor monetario", matriz: tablaDinero, estados: estadosAceptacionDinero },
  { tipo: "Porcentaje", matriz: tablaPorcentaje, estados: estadosAceptacionPorcentaje },
  { tipo: "Real", matriz: tablaReales, estados: estadosAceptacionReales },
  { tipo: "Natural", matriz: tablaNaturales, estados: estadosAceptacionNaturales }
];

function clasificarToken(str) {
  const aut = automatas.find(a => ejecutarAFD(a.matriz, a.estados, str));
  return aut?.tipo ?? null;
}

function esEspacioBlanco(c) {
  return c === " " || c === "\t" || c === "\n" || c === "\r";
}

function tieneDigito(str) {
  return Array.from(str).some(c => c >= "0" && c <= "9");
}

input.addEventListener("input", function () {
  characterCount.textContent = input.value.length;
});

function obtenerNumeroLinea(texto, indice, areaTexto) {
  const estilo = getComputedStyle(areaTexto);
  const espejo = document.createElement("div");
  [
    "font", "lineHeight", "letterSpacing", "wordSpacing",
    "textAlign", "textIndent", "textTransform",
    "paddingTop", "paddingRight", "paddingBottom",
    "paddingLeft", "tabSize", "direction", "boxSizing"
  ].forEach(function (prop) {
    espejo.style[prop] = estilo[prop];
  });

  espejo.style.position = "fixed";
  espejo.style.visibility = "hidden";
  espejo.style.left = "-10000px";
  espejo.style.top = "0";
  espejo.style.width = areaTexto.clientWidth + "px";
  espejo.style.height = "auto";
  espejo.style.border = "0";
  espejo.style.whiteSpace = "pre-wrap";
  espejo.style.overflowWrap = "break-word";
  espejo.style.wordBreak = estilo.wordBreak;

  espejo.appendChild(document.createTextNode(texto.slice(0, indice)));

  const marca = document.createElement("span");
  marca.textContent = "\u200B";
  espejo.appendChild(marca);

  document.body.appendChild(espejo);

  const posicion = marca.getBoundingClientRect();
  const posicionInicial = espejo.getBoundingClientRect();

  const altura = parseFloat(estilo.lineHeight) || (parseFloat(estilo.fontSize) * 1.2);
  const linea = Math.round((posicion.top - posicionInicial.top) / altura);
  espejo.remove();
  return linea;
}

function analizarTexto(texto) {
  const encontrados = [];
  let i = 0;
  const n = texto.length;

  while (i < n) {
    while (i < n && esEspacioBlanco(texto[i])) {
      i++;
    }

    let inicioIdx = i;
    while (i < n && !esEspacioBlanco(texto[i])) {
      i++;
    }
    let finIdx = i;
    let token = texto.slice(inicioIdx, finIdx);

    while (token.length > 0 && (token[0] === "(" || token[0] === '"' || token[0] === "'")) {
      token = token.slice(1);
      inicioIdx++;
    }

    while (token.length > 0 && (token[token.length - 1] === ")" || token[token.length - 1] === '"' || token[token.length - 1] === "'")) {
      token = token.slice(0, -1);
      finIdx--;
    }

    while (token.length > 1 && (token[token.length - 1] === "." || token[token.length - 1] === ",")) {
      token = token.slice(0, -1);
      finIdx--;
    }

    while (token.length > 0 && token[token.length - 1] === " ") {
      token = token.slice(0, -1);
      finIdx--;
    }

    const tipo = tieneDigito(token) ? clasificarToken(token) : null;
    tipo && encontrados.push({
      start: inicioIdx,
      end: finIdx,
      text: token,
      type: tipo,
      line: obtenerNumeroLinea(texto, inicioIdx, input)
    });
  }

  return encontrados;
}

function mostrarResultados(coincidencias) {
  resultsBody.innerHTML = "";

  if (coincidencias.length === 0) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 4;
    celda.textContent = "No se encontraron números.";
    fila.appendChild(celda);
    resultsBody.appendChild(fila);
    matchCount.textContent = "0 coincidencias";
    results.hidden = false;
    return;
  }

  coincidencias.forEach(function (elemento, indice) {
    const fila = document.createElement("tr");

    [indice + 1, elemento.line, elemento.text, elemento.type].forEach(function (valor) {
      const celda = document.createElement("td");
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    resultsBody.appendChild(fila);
  });

  const sufijo = coincidencias.length === 1 ? " coincidencia" : " coincidencias";
  matchCount.textContent = coincidencias.length + sufijo;
  results.hidden = false;
}

document.getElementById("verify-button").addEventListener("click", function () {
  const texto = input.value.trim();

  if (texto === "") {
    status.textContent = "Escribe un texto antes de verificar.";
    results.hidden = true;
    return;
  }

  status.textContent = "Texto analizado correctamente.";
  const coincidencias = analizarTexto(texto);
  mostrarResultados(coincidencias);
});

document.getElementById("clear-button").addEventListener("click", function () {
  input.value = "";
  characterCount.textContent = "0";
  status.textContent = "Esperando texto para analizar.";
  resultsBody.innerHTML = "";
  matchCount.textContent = "0 coincidencias";
  results.hidden = true;
  input.focus();
});

// CÓDIGO NUEVO: Parser EXAR (autómata de pila)
const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const tablaIdentificador = {
  0: { [letras]: 1 },
  1: { [letras]: 1, "0123456789": 1 },
  "-1": {}
};
const estadosAceptacionIdentificador = [1];

const tablaConstante = {
  0: { "0123456789": 1 },
  1: { "0123456789": 1, ".": 2, "E": 4 },
  2: { "0123456789": 3 },
  3: { "0123456789": 3, "E": 4 },
  4: { "0123456789": 5 },
  5: { "0123456789": 5 },
  "-1": {}
};
const estadosAceptacionConstante = [1, 3, 5];

const mensajesError = {
  101: "Símbolo desconocido",
  102: "Elemento inválido",
  201: "Falta delimitador",
  202: "Falta operador",
  203: "Falta identificador / constante"
};

const parserInput = document.getElementById("parser-input");
const parserMensaje = document.getElementById("parser-mensaje");

function crearError(codigo, linea) {
  const numeroLinea = String(linea).padStart(2, "0");
  if (codigo < 200) {
    return "1:" + codigo + " Error en Línea " + numeroLinea + ": " + mensajesError[codigo] + ".";
  }
  return "2:" + codigo + " Error Línea " + numeroLinea + ". " + mensajesError[codigo] + ".";
}

function obtenerTokens(texto) {
  const tokens = [];
  let linea = 1;
  let i = 0;

  while (i < texto.length) {
    const c = texto[i];

    if (c === "\n") {
      linea++;
      i++;
    } else if (c === " " || c === "\t" || c === "\r") {
      i++;
    } else if ("+-*/".includes(c)) {
      tokens.push({ texto: c, tipo: "operador", linea: linea });
      i++;
    } else if (c === "(") {
      tokens.push({ texto: c, tipo: "abre", linea: linea });
      i++;
    } else if (c === ")") {
      tokens.push({ texto: c, tipo: "cierra", linea: linea });
      i++;
    } else if (c === ";") {
      tokens.push({ texto: c, tipo: "fin", linea: linea });
      i++;
    } else if (/[A-Za-z0-9.]/.test(c)) {
      let palabra = "";
      while (i < texto.length && /[A-Za-z0-9.]/.test(texto[i])) {
        palabra += texto[i];
        i++;
      }
      if (ejecutarAFD(tablaIdentificador, estadosAceptacionIdentificador, palabra)) {
        tokens.push({ texto: palabra, tipo: "identificador", linea: linea });
      } else if (ejecutarAFD(tablaConstante, estadosAceptacionConstante, palabra)) {
        tokens.push({ texto: palabra, tipo: "constante", linea: linea });
      } else {
        return { error: crearError(102, linea) };
      }
    } else {
      return { error: crearError(101, linea) };
    }
  }

  return { tokens: tokens };
}

function analizarSintaxis(tokens) {
  const pila = [];
  let esperaOperando = true;

  for (const t of tokens) {
    if (esperaOperando) {
      if (t.tipo === "identificador" || t.tipo === "constante") {
        esperaOperando = false;
      } else if (t.tipo === "abre") {
        pila.push("(");
      } else {
        return crearError(203, t.linea);
      }
    } else {
      if (t.tipo === "operador") {
        esperaOperando = true;
      } else if (t.tipo === "cierra") {
        if (pila.length === 0) {
          return crearError(201, t.linea);
        }
        pila.pop();
      } else if (t.tipo === "fin") {
        if (pila.length > 0) {
          return crearError(201, t.linea);
        }
        esperaOperando = true;
      } else {
        return crearError(202, t.linea);
      }
    }
  }

  const ultimo = tokens[tokens.length - 1];
  if (ultimo.tipo !== "fin") {
    if (esperaOperando) {
      return crearError(203, ultimo.linea);
    }
    return crearError(201, ultimo.linea);
  }

  return null;
}

function moduloEntrada() {
  return parserInput.value;
}

function moduloAnalisis(texto) {
  const resultado = obtenerTokens(texto);
  if (resultado.error) {
    return resultado.error;
  }
  return analizarSintaxis(resultado.tokens);
}

function moduloResultados() {
  parserMensaje.textContent = "1:100 Sin error.";
  parserMensaje.style.color = "green";
}

function moduloErrores(mensaje) {
  parserMensaje.textContent = mensaje;
  parserMensaje.style.color = "red";
}

document.getElementById("parser-button").addEventListener("click", function () {
  const texto = moduloEntrada();

  if (texto.trim() === "") {
    parserMensaje.textContent = "Escribe una expresión antes de analizar.";
    parserMensaje.style.color = "black";
    return;
  }

  const error = moduloAnalisis(texto);

  if (error === null) {
    moduloResultados();
  } else {
    moduloErrores(error);
  }
});

document.getElementById("parser-clear").addEventListener("click", function () {
  parserInput.value = "";
  parserMensaje.textContent = "Esperando expresiones para analizar.";
  parserMensaje.style.color = "black";
  parserInput.focus();
});
