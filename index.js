// Parser EXAR - Unidad 4: Análisis Sintáctico (AFD léxico + Autómata de Pila)

const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const digitos = "0123456789";

// AFD para identificadores: letra seguida de cero o más letras/dígitos
const tablaIdentificador = {
  0: { [letras]: 1 },
  1: { [letras]: 1, [digitos]: 1 },
  "-1": {}
};
const estadosAceptacionIdentificador = [1];

// AFD para constantes numéricas: enteros, decimales y notación científica (E/e con signo opcional)
const tablaConstante = {
  0: { [digitos]: 1 },
  1: { [digitos]: 1, ".": 2, "Ee": 4 },
  2: { [digitos]: 3 },
  3: { [digitos]: 3, "Ee": 4 },
  4: { "+-": 5, [digitos]: 6 },
  5: { [digitos]: 6 },
  6: { [digitos]: 6 },
  "-1": {}
};
const estadosAceptacionConstante = [1, 3, 6];

// Catálogo de códigos léxicos y sintácticos (Sección 5.2)
const mensajesError = {
  100: "Sin error",
  101: "Símbolo desconocido",
  102: "Elemento inválido",
  200: "Sin error",
  201: "Falta delimitador",
  202: "Falta operador",
  203: "Falta identificador / constante"
};

// Tabla de transiciones del Autómata de Pila: δ(estado, tipoToken, topePila)
// Estados: q0 = espera operando o '(', q1 = espera operador, ')' o ';'
// Alfabeto de pila: Z0 (fondo de pila), "("
const tablaAP = {
  q0: {
    identificador: { "*": { estado: "q1", accion: "mantener" } },
    constante: { "*": { estado: "q1", accion: "mantener" } },
    abre: { "*": { estado: "q0", accion: "apilar" } },
    cierra: {
      Z0: { error: 201 },
      "(": { error: 203 }
    },
    operador: { "*": { error: 203 } },
    fin: { "*": { error: 203 } }
  },
  q1: {
    operador: { "*": { estado: "q0", accion: "mantener" } },
    cierra: {
      "(": { estado: "q1", accion: "desapilar" },
      Z0: { error: 201 }
    },
    fin: {
      Z0: { estado: "q0", accion: "mantener" },
      "(": { error: 201 }
    },
    abre: { "*": { error: 202 } },
    identificador: { "*": { error: 202 } },
    constante: { "*": { error: 202 } }
  }
};

const parserInput = document.getElementById("parser-input");
const parserResultados = document.getElementById("parser-resultados");
const parserTablaBody = document.getElementById("parser-tabla-body");

// 1. Módulo de Entrada
function moduloEntrada() {
  return parserInput.value;
}

// 2. Aviso cuando la entrada está vacía
function mostrarAviso(texto) {
  parserTablaBody.innerHTML = "";
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 5;
  td.className = "fila-aviso";
  td.textContent = texto;
  tr.appendChild(td);
  parserTablaBody.appendChild(tr);
  parserResultados.hidden = false;
}

// 3. Módulo de Análisis: separa por fila y por ';', analiza cada expresión e invoca resultados o errores
function moduloAnalisis(texto) {
  const lineas = texto.split(/\r?\n/);
  const resultadosPorFila = [];

  lineas.forEach(function (linea, indice) {
    if (linea.trim() !== "") {
      const expresiones = separarExpresionesDeFila(linea);
      expresiones.forEach(function (expresion) {
        resultadosPorFila.push(analizarFila(expresion, indice + 1));
      });
    }
  });

  if (resultadosPorFila.length === 0) {
    const err = crearResultado(203, 1);
    moduloErrores(err.mensaje, [{
      fila: err.fila,
      expresion: "(vacío)",
      tipo: err.tipo,
      codigos: err.codigos,
      codigo: err.codigo,
      descripcion: err.descripcion,
      mensaje: err.mensaje,
      esError: true
    }]);
    return err.mensaje;
  }

  const primerError = resultadosPorFila.find(r => r.esError);

  if (!primerError) {
    moduloResultados(resultadosPorFila);
    return null;
  }

  moduloErrores(primerError.mensaje, resultadosPorFila);
  return primerError.mensaje;
}

// 4. Separa múltiples expresiones en una misma fila usando ';' como delimitador y aplica trim()
function separarExpresionesDeFila(linea) {
  const expresiones = [];
  let actual = "";

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    actual += c;
    if (c === ";") {
      expresiones.push(actual.trim());
      actual = "";
    }
  }

  if (actual.trim() !== "") {
    expresiones.push(actual.trim());
  }

  return expresiones;
}

// 5. Analiza una expresión individual de una fila y devuelve su resultado estructurado
function analizarFila(textoExpresion, numeroLinea) {
  const expresion = textoExpresion.trim();
  const resultadoLexico = obtenerTokens(expresion, numeroLinea);
  const error = resultadoLexico.error || analizarSintaxis(resultadoLexico.tokens, numeroLinea);

  if (error) {
    return {
      fila: error.fila,
      expresion: expresion,
      tipo: error.tipo,
      codigos: error.codigos,
      codigo: error.codigo,
      descripcion: error.descripcion,
      mensaje: error.mensaje,
      esError: true
    };
  }

  const okLexico = crearResultado(100, numeroLinea);
  const okSintactico = crearResultado(200, numeroLinea);

  return {
    fila: okLexico.fila,
    expresion: expresion,
    tipo: "1 / 2",
    codigos: ["100", "200"],
    codigo: "1:100 / 2:200",
    descripcion: okSintactico.descripcion,
    mensaje: okLexico.mensaje + " | " + okSintactico.mensaje,
    esError: false
  };
}

// 6. Fase 1: Análisis léxico de una fila (tokenización + clasificación con AFD)
function obtenerTokens(texto, numeroLinea = 1) {
  const tokens = [];
  let linea = numeroLinea;
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
      while (i < texto.length) {
        const ch = texto[i];
        if (/[A-Za-z0-9.]/.test(ch)) {
          palabra += ch;
          i++;
        } else if (
          (ch === "+" || ch === "-") &&
          /^[0-9]+(\.[0-9]+)?[Ee]$/.test(palabra) &&
          i + 1 < texto.length &&
          /[0-9]/.test(texto[i + 1])
        ) {
          // Incluye el signo del exponente en notación científica (ej. 3.56E-45)
          palabra += ch;
          i++;
        } else {
          break;
        }
      }

      if (ejecutarAFD(tablaIdentificador, estadosAceptacionIdentificador, palabra)) {
        tokens.push({ texto: palabra, tipo: "identificador", linea: linea });
      } else if (ejecutarAFD(tablaConstante, estadosAceptacionConstante, palabra)) {
        tokens.push({ texto: palabra, tipo: "constante", linea: linea });
      } else {
        return { error: crearResultado(102, linea) };
      }
    } else {
      return { error: crearResultado(101, linea) };
    }
  }

  return { tokens: tokens };
}

// 7. Evaluador AFD usado por la fase léxica
function ejecutarAFD(matriz, estadosAceptacion, cadenaEntrada) {
  let estado = 0;
  for (let i = 0; i < cadenaEntrada.length; i++) {
    const fila = matriz[estado] || matriz["-1"];
    const clave = Object.keys(fila).find(k => k.includes(cadenaEntrada[i]));
    estado = fila[clave] ?? -1;
  }
  return estadosAceptacion.includes(estado);
}

// 8. Fase 2: Análisis sintáctico mediante Autómata de Pila
function analizarSintaxis(tokens, numeroLinea = 1) {
  if (tokens.length === 0) {
    return crearResultado(203, numeroLinea);
  }

  const pila = ["Z0"];
  let estado = "q0";

  for (const t of tokens) {
    const tope = pila[pila.length - 1];
    const transicionesToken = tablaAP[estado][t.tipo];
    const transicion = transicionesToken[tope] || transicionesToken["*"];

    if (transicion.error) {
      return crearResultado(transicion.error, t.linea);
    }

    if (transicion.accion === "apilar") {
      pila.push("(");
    } else if (transicion.accion === "desapilar") {
      pila.pop();
    }

    estado = transicion.estado;
  }

  const ultimo = tokens[tokens.length - 1];
  if (ultimo.tipo !== "fin") {
    if (estado === "q0") {
      return crearResultado(203, ultimo.linea);
    }
    return crearResultado(201, ultimo.linea);
  }

  if (pila[pila.length - 1] !== "Z0") {
    return crearResultado(201, ultimo.linea);
  }

  return null;
}

// 9. Construye el objeto de resultado / error con formato de la Tabla 5.2
function crearResultado(codigo, linea) {
  const tipo = codigo < 200 ? 1 : 2;
  const codigoCompleto = tipo + ":" + codigo;
  const descripcion = mensajesError[codigo] + ".";
  const numeroLinea = String(linea).padStart(2, "0");

  let mensaje;
  if (codigo === 100 || codigo === 200) {
    mensaje = codigoCompleto + " " + descripcion;
  } else if (tipo === 1) {
    mensaje = codigoCompleto + " Error en Línea " + numeroLinea + ": " + descripcion;
  } else {
    mensaje = codigoCompleto + " Error Línea " + numeroLinea + ". " + descripcion;
  }

  return {
    fila: numeroLinea,
    tipo: String(tipo),
    codigos: [String(codigo)],
    codigo: codigoCompleto,
    descripcion: descripcion,
    mensaje: mensaje,
    esError: codigo !== 100 && codigo !== 200
  };
}

// 10. Módulo de Resultados
function moduloResultados(filas) {
  mostrarTabla(filas);
}

// 11. Módulo de Errores
function moduloErrores(mensaje, filas) {
  mostrarTabla(filas);
}

// 12. Renderiza la tabla de resultados en el DOM
function mostrarTabla(filas) {
  parserTablaBody.innerHTML = "";

  filas.forEach(function (item) {
    const tr = document.createElement("tr");
    tr.className = item.esError ? "fila-error" : "fila-ok";

    const tdFila = document.createElement("td");
    tdFila.className = "col-fila";
    tdFila.textContent = item.fila;

    const tdExpresion = document.createElement("td");
    tdExpresion.className = "col-expresion";
    tdExpresion.textContent = item.expresion;

    const tdTipo = document.createElement("td");
    tdTipo.className = "col-tipo";
    tdTipo.textContent = item.tipo;

    const tdCodigo = document.createElement("td");
    tdCodigo.className = "col-codigo";
    item.codigos.forEach(function (cod) {
      const badge = document.createElement("span");
      badge.className = "codigo-badge";
      badge.textContent = cod;
      tdCodigo.appendChild(badge);
    });

    const tdDescripcion = document.createElement("td");
    tdDescripcion.textContent = item.descripcion;

    tr.appendChild(tdFila);
    tr.appendChild(tdExpresion);
    tr.appendChild(tdTipo);
    tr.appendChild(tdCodigo);
    tr.appendChild(tdDescripcion);
    parserTablaBody.appendChild(tr);
  });

  parserResultados.hidden = filas.length === 0;
}

// Eventos de la interfaz
document.getElementById("parser-button").addEventListener("click", function () {
  const texto = moduloEntrada();

  if (texto.trim() === "") {
    mostrarAviso("Escribe una expresión antes de analizar.");
    return;
  }

  moduloAnalisis(texto);
});

document.getElementById("parser-clear").addEventListener("click", function () {
  parserInput.value = "";
  parserTablaBody.innerHTML = "";
  parserResultados.hidden = true;
  parserInput.focus();
});
