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

const ESTADO_ACEPTACION = 2;
const ESTADOS_ACEPTACION = [1, ESTADO_ACEPTACION];

const ESTADOS_ERROR = {
  E101: { tipo: 1, codigo: 101, significado: "Símbolo desconocido." },
  E102: { tipo: 1, codigo: 102, significado: "Elemento inválido." },
  E201: { tipo: 2, codigo: 201, significado: "Falta delimitador." },
  E202: { tipo: 2, codigo: 202, significado: "Falta operador." },
  E203: { tipo: 2, codigo: 203, significado: "Falta identificador / constante." }
};

const matrizEstadosAP = {
  0: [
    { caracter: "ID",          quitar: "", insertar: "",  siguiente: 1 },
    { caracter: "CONST",       quitar: "", insertar: "",  siguiente: 1 },
    { caracter: "(",           quitar: "", insertar: "(", siguiente: 0 },
    { caracter: "OPERADOR",    quitar: "", insertar: "",  siguiente: "E203" },
    { caracter: ")",           quitar: "", insertar: "",  siguiente: "E203" },
    { caracter: ";",           quitar: "", insertar: "",  siguiente: "E203" },
    { caracter: "DESCONOCIDO", quitar: "", insertar: "",  siguiente: "E101" },
    { caracter: "INVALIDO",    quitar: "", insertar: "",  siguiente: "E102" }
  ],
  1: [
    { caracter: "OPERADOR",    quitar: "",  insertar: "", siguiente: 0 },
    { caracter: ")",           quitar: "(", insertar: "", siguiente: 1 },
    { caracter: ";",           quitar: "",  insertar: "", siguiente: ESTADO_ACEPTACION },
    { caracter: "ID",          quitar: "",  insertar: "", siguiente: "E202" },
    { caracter: "CONST",       quitar: "",  insertar: "", siguiente: "E202" },
    { caracter: "(",           quitar: "",  insertar: "", siguiente: "E202" },
    { caracter: "DESCONOCIDO", quitar: "",  insertar: "", siguiente: "E101" },
    { caracter: "INVALIDO",    quitar: "",  insertar: "", siguiente: "E102" }
  ],
  2: [
    { caracter: "DESCONOCIDO", quitar: "", insertar: "", siguiente: "E101" },
    { caracter: "INVALIDO",    quitar: "", insertar: "", siguiente: "E102" },
    { caracter: "*",           quitar: "", insertar: "", siguiente: "E201" }
  ],
  E101: [{ caracter: "*", quitar: "", insertar: "", siguiente: "E101" }],
  E102: [{ caracter: "*", quitar: "", insertar: "", siguiente: "E102" }],
  E201: [{ caracter: "*", quitar: "", insertar: "", siguiente: "E201" }],
  E202: [{ caracter: "*", quitar: "", insertar: "", siguiente: "E202" }],
  E203: [{ caracter: "*", quitar: "", insertar: "", siguiente: "E203" }]
};

const parserInput = document.getElementById("parser-input");
const parserMensaje = document.getElementById("parser-mensaje");
const parserResultados = document.getElementById("parser-resultados");

document.getElementById("parser-button").addEventListener("click", function () {
  if (parserInput.value.trim() === "") {
    parserMensaje.textContent = "Escribe una expresión antes de analizar.";
    parserMensaje.style.color = "black";
    parserResultados.innerHTML = "";
    return;
  }

  const expresiones = moduloEntrada();
  const resultados = moduloAnalisis(expresiones);
  mostrarResultadosEnPantalla(resultados);
});

function moduloEntrada() {
  const texto = parserInput.value;
  const expresiones = [];
  const lineas = texto.split(/\r?\n/);

  lineas.forEach((contenidoLinea, indiceLinea) => {
    const numeroLinea = indiceLinea + 1;
    let actual = "";

    for (let i = 0; i < contenidoLinea.length; i++) {
      const c = contenidoLinea[i];
      if (actual === "" && (c === " " || c === "\t")) {
        continue;
      }

      if (c === " " || c === "\t") {
        if (actual.trim() !== "") {
          expresiones.push({ texto: actual.trim(), lineaInicio: numeroLinea });
        }
        actual = "";
        continue;
      }

      actual += c;

      if (c === ";") {
        expresiones.push({ texto: actual, lineaInicio: numeroLinea });
        actual = "";
      }
    }

    if (actual.trim() !== "") {
      expresiones.push({ texto: actual, lineaInicio: numeroLinea });
    }
  });

  return expresiones;
}

function moduloAnalisis(expresiones) {
  return expresiones.map((exp, idx) => {
    const tokens = obtenerTokens(exp.texto, exp.lineaInicio);
    const resultadoAP = ejecutarAutomataPila(tokens, exp.lineaInicio);

    if (resultadoAP.ok) {
      return moduloResultados(idx + 1, exp.texto);
    }
    return moduloErrores(idx + 1, exp.texto, resultadoAP.estadoError, resultadoAP.linea);
  });
}

function obtenerTokens(texto, lineaInicial) {
  const tokens = [];
  let linea = lineaInicial;
  let i = 0;

  while (i < texto.length) {
    const c = texto[i];

    if (c === "\n") {
      linea++;
      i++;
    } else if (c === " " || c === "\t" || c === "\r") {
      i++;
    } else if ("+-*/".includes(c)) {
      tokens.push({ caracter: "OPERADOR", texto: c, linea: linea });
      i++;
    } else if (c === "(" || c === ")" || c === ";") {
      tokens.push({ caracter: c, texto: c, linea: linea });
      i++;
    } else if (/[A-Za-z0-9.]/.test(c)) {
      let palabra = "";
      while (i < texto.length && /[A-Za-z0-9.]/.test(texto[i])) {
        palabra += texto[i];
        i++;
      }
      if (ejecutarAFD(tablaIdentificador, estadosAceptacionIdentificador, palabra)) {
        tokens.push({ caracter: "ID", texto: palabra, linea: linea });
      } else if (ejecutarAFD(tablaConstante, estadosAceptacionConstante, palabra)) {
        tokens.push({ caracter: "CONST", texto: palabra, linea: linea });
      } else {
        tokens.push({ caracter: "INVALIDO", texto: palabra, linea: linea });
      }
    } else {
      tokens.push({ caracter: "DESCONOCIDO", texto: c, linea: linea });
      i++;
    }
  }

  return tokens;
}

function ejecutarAFD(matriz, estadosAceptacion, cadenaEntrada) {
  let estado = 0;
  for (let i = 0; i < cadenaEntrada.length; i++) {
    const fila = matriz[estado] || matriz["-1"];
    const clave = Object.keys(fila).find(k => k.includes(cadenaEntrada[i]));
    estado = fila[clave] ?? -1;
  }
  return estadosAceptacion.includes(estado);
}

function ejecutarAutomataPila(tokens, lineaFinal) {
  let estado = 0;
  const pila = [];
  let lineaError = null;

  for (const token of tokens) {
    const transicion = buscarTransicion(estado, token.caracter);
    if (!transicion) {
      if (lineaError === null) lineaError = token.linea;
      estado = "E201";
      continue;
    }

    if (transicion.quitar !== "") {
      if (pila.length === 0 || pila[pila.length - 1] !== transicion.quitar) {
        if (lineaError === null) lineaError = token.linea;
        estado = "E201";
        continue;
      }
      pila.pop();
    }

    if (transicion.insertar !== "") {
      pila.push(transicion.insertar);
    }

    const estadoAnterior = estado;
    estado = transicion.siguiente;

    if (ESTADOS_ERROR[estado] && !ESTADOS_ERROR[estadoAnterior]) {
      lineaError = token.linea;
    }
  }

  if (ESTADOS_ACEPTACION.includes(estado) && pila.length === 0) {
    return { ok: true };
  }

  if (!ESTADOS_ERROR[estado]) {
    const ultimo = tokens[tokens.length - 1];
    lineaError = ultimo ? ultimo.linea : lineaFinal;
    if (ESTADOS_ACEPTACION.includes(estado) && pila.length > 0) {
      estado = "E201";
    } else {
      estado = estado === 0 ? "E203" : "E201";
    }
  }

  return { ok: false, estadoError: estado, linea: lineaError };
}

function buscarTransicion(estado, caracterToken) {
  const transiciones = matrizEstadosAP[estado] || [];
  return transiciones.find(t => t.caracter === caracterToken || t.caracter === "*");
}

function moduloResultados(indice, expresionTexto) {
  return {
    indice: indice,
    expresion: expresionTexto,
    ok: true,
    mensaje: "1:100 Sin error. | 2:200 Sin error."
  };
}

function moduloErrores(indice, expresionTexto, estadoError, linea) {
  const info = ESTADOS_ERROR[estadoError];
  const numeroLinea = String(linea).padStart(2, "0");
  const mensaje = info.tipo === 1
    ? `1:${info.codigo} Error en Línea ${numeroLinea}: ${info.significado}`
    : `2:${info.codigo} Error Línea ${numeroLinea}. ${info.significado}`;

  return {
    indice: indice,
    expresion: expresionTexto,
    ok: false,
    mensaje: mensaje
  };
}

function mostrarResultadosEnPantalla(resultados) {
  parserResultados.innerHTML = "";
  const errores = resultados.filter(r => !r.ok);

  if (errores.length === 0) {
    parserMensaje.textContent = "1:100 Sin error. | 2:200 Sin error.";
    parserMensaje.style.color = "green";
    return;
  }

  parserMensaje.textContent = "";
  errores.forEach(res => {
    const item = document.createElement("div");
    item.className = "resultado-item error";
    item.textContent = `${res.expresion.trim()} → ${res.mensaje}`;
    parserResultados.appendChild(item);
  });
}

document.getElementById("parser-clear").addEventListener("click", function () {
  parserInput.value = "";
  parserMensaje.textContent = "Esperando expresiones para analizar.";
  parserMensaje.style.color = "black";
  parserResultados.innerHTML = "";
  parserInput.focus();
});
