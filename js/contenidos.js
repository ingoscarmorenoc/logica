/* Contenidos editables: retos de diagramas (FLOW_RETOS), temas del tutor (TEMAS) y retos de C++ (CPP_RETOS).
   Para agregar un ejercicio copie un objeto existente y ajuste sus campos. */
/* ================= CONTENIDOS ================= */
const FLOW_RETOS=[
 {id:'f1',t:'Saludo personalizado',d:'Lee el nombre de una persona y muestra un saludo que lo incluya, por ejemplo: Hola, Ana.',conc:['Entrada','Salida','Texto'],
  tests:[{in:['Ana'],ex:['hola','ana']},{in:['Luis'],ex:['hola','luis']}],
  sol:[{type:'entrada',text:'nombre'},{type:'salida',text:'"Hola, ", nombre'}]},
 {id:'f2',t:'Suma de dos números',d:'Lee dos números, calcula su suma y muestra el resultado.',conc:['Entrada','Proceso','Salida'],
  tests:[{in:[4,6],ex:['10']},{in:[-2,7],ex:['5']}],
  sol:[{type:'entrada',text:'a, b'},{type:'proceso',text:'suma = a + b'},{type:'salida',text:'"La suma es: ", suma'}]},
 {id:'f3',t:'Área de un triángulo',d:'Lee la base y la altura de un triángulo y muestra su área (base × altura ÷ 2).',conc:['Fórmulas','Variables'],
  tests:[{in:[10,4],ex:['20']},{in:[5,3],ex:['7.5']}],
  sol:[{type:'entrada',text:'base, altura'},{type:'proceso',text:'area = base * altura / 2'},{type:'salida',text:'"El área es: ", area'}]},
 {id:'f4',t:'¿Par o impar?',d:'Lee un número entero e indica si es par o impar. Pista: un número es par si el residuo de dividirlo entre 2 es 0 (MOD).',conc:['Decisión','MOD'],req:['decision'],
  tests:[{in:[8],ex:['par']},{in:[7],ex:['impar']}],
  sol:[{type:'entrada',text:'n'},{type:'decision',text:'n MOD 2 = 0',yes:[{type:'salida',text:'"El número es par"'}],no:[{type:'salida',text:'"El número es impar"'}]}]},
 {id:'f5',t:'Aprobado o reprobado',d:'Lee la nota de un aprendiz (0.0 a 5.0). Si es mayor o igual a 3.0 muestra “Aprobado”; si no, “Reprobado”.',conc:['Decisión','Relacionales'],req:['decision'],
  tests:[{in:[3.5],ex:['aprobado']},{in:[2.9],ex:['reprobado']},{in:[3],ex:['aprobado']}],
  sol:[{type:'entrada',text:'nota'},{type:'decision',text:'nota >= 3.0',yes:[{type:'salida',text:'"Aprobado"'}],no:[{type:'salida',text:'"Reprobado"'}]}]},
 {id:'f6',t:'Mayor de dos números',d:'Lee dos números y muestra cuál es el mayor.',conc:['Decisión'],req:['decision'],
  tests:[{in:[3,9],ex:['9']},{in:[12,5],ex:['12']}],
  sol:[{type:'entrada',text:'a, b'},{type:'decision',text:'a > b',yes:[{type:'salida',text:'"El mayor es: ", a'}],no:[{type:'salida',text:'"El mayor es: ", b'}]}]},
 {id:'f7',t:'Contar del 1 al N',d:'Lee un número N y muestra los números desde 1 hasta N, uno por línea, usando un ciclo.',conc:['Ciclo Mientras','Contador'],req:['mientras','para'],
  tests:[{in:[5],ex:['1','2','3','4','5']},{in:[3],ex:['1','2','3']}],
  sol:[{type:'entrada',text:'n'},{type:'proceso',text:'i = 1'},{type:'mientras',text:'i <= n',body:[{type:'salida',text:'i'},{type:'proceso',text:'i = i + 1'}]}]},
 {id:'f8',t:'Suma de 1 a N',d:'Lee N y calcula la suma 1 + 2 + … + N usando un acumulador dentro de un ciclo Para.',conc:['Ciclo Para','Acumulador'],req:['mientras','para'],
  tests:[{in:[4],ex:['10']},{in:[10],ex:['55']}],
  sol:[{type:'entrada',text:'n'},{type:'proceso',text:'suma = 0'},{type:'para',v:'i',from:'1',to:'n',step:'1',body:[{type:'proceso',text:'suma = suma + i'}]},{type:'salida',text:'"La suma es: ", suma'}]}
];

const TEMAS=[
 {id:'t1',nombre:'Algoritmos y secuencia',
  intro:`<p><b>Un algoritmo</b> es una serie <b>finita</b>, <b>ordenada</b> y <b>precisa</b> de pasos para resolver un problema. Todo algoritmo tiene tres momentos:</p><ol><li><b>Entrada:</b> los datos que necesito.</li><li><b>Proceso:</b> los cálculos o transformaciones.</li><li><b>Salida:</b> el resultado que muestro.</li></ol><p>En una estructura <b>secuencial</b> los pasos se ejecutan uno tras otro, de arriba hacia abajo, sin saltos.</p>`,
  ej:[
   {tipo:'ord',q:`<p>Ordena los pasos del algoritmo para calcular el área de un rectángulo. Escribe las letras en orden (por ejemplo: <code>ABCDE</code>):</p><ul><li>A) Mostrar el área</li><li>B) Leer base y altura</li><li>C) Inicio</li><li>D) Calcular área = base * altura</li><li>E) Fin</li></ul>`,a:'CBDAE',hint:'Todo algoritmo empieza en Inicio, luego necesita los datos (entrada) antes de poder calcular.',exp:'El orden es <b>C → B → D → A → E</b>: Inicio, Entrada (leer datos), Proceso (calcular), Salida (mostrar) y Fin. No se puede calcular un dato que aún no se ha leído.'},
   {tipo:'op',q:'<p>En el algoritmo “calcular el promedio de 3 notas”, ¿cuál es la <b>entrada</b>?</p>',o:['Las tres notas','El promedio','La fórmula (n1+n2+n3)/3','Mostrar el resultado'],a:0,hint:'La entrada son los datos que el algoritmo necesita recibir para empezar a trabajar.',exp:'La entrada son <b>las tres notas</b>. La fórmula es el proceso y el promedio es la salida.'},
   {tipo:'op',q:'<p>Un compañero escribe: <code>Repetir: sumar 1 a x</code>, sin indicar cuándo detenerse. ¿Qué característica de un algoritmo <b>no</b> cumple?</p>',o:['Preciso','Finito','Ordenado','Tiene entrada'],a:1,hint:'Piensa en qué pasaría si lo ejecutas: ¿terminaría alguna vez?',exp:'No es <b>finito</b>: nunca termina. Todo algoritmo debe llegar a un final en un número limitado de pasos.'},
   {tipo:'op',q:'<p>En un diagrama de flujo, ¿qué figura representa una <b>decisión</b>?</p>',o:['Rectángulo','Óvalo','Rombo','Paralelogramo'],a:2,hint:'Es la figura con cuatro puntas de la que salen dos caminos: Sí y No.',exp:'El <b>rombo</b> representa una decisión. El óvalo marca inicio y fin, el rectángulo un proceso y el paralelogramo la entrada de datos.'}
  ]},
 {id:'t2',nombre:'Variables y operadores',
  intro:`<p>Una <b>variable</b> es un espacio en memoria con un <b>nombre</b>, un <b>tipo</b> y un <b>valor</b> que puede cambiar. La <b>asignación</b> (<code>=</code>) guarda en la variable de la izquierda el resultado de la derecha.</p><p>Tipos básicos en C++: <code>int</code> (enteros), <code>double</code> (decimales), <code>char</code> (un carácter), <code>bool</code> (verdadero/falso) y <code>string</code> (texto).</p><p>Precedencia de operadores: primero <code>( )</code>, luego <code>* / %</code> y al final <code>+ -</code>. El operador <code>%</code> (MOD) devuelve el <b>residuo</b> de una división.</p>`,
  ej:[
   {tipo:'num',q:'<p>¿Cuál es el valor final de <code>x</code>?</p><pre>x = 5\nx = x + 3\nx = x * 2</pre>',a:16,hint:'Ve línea por línea: después de la segunda línea x vale 8.',exp:'x empieza en 5, luego 5 + 3 = 8 y finalmente 8 × 2 = <b>16</b>. La asignación siempre reemplaza el valor anterior.'},
   {tipo:'num',q:'<p>¿Cuánto da la expresión <code>2 + 3 * 4 - 6 / 2</code>?</p>',a:11,hint:'Primero resuelve la multiplicación y la división, luego sumas y restas de izquierda a derecha.',exp:'3 × 4 = 12 y 6 ÷ 2 = 3, entonces 2 + 12 − 3 = <b>11</b>.'},
   {tipo:'num',q:'<p>¿Cuánto vale <code>17 % 5</code>?</p>',a:2,hint:'% devuelve lo que sobra al dividir: ¿cuántas veces cabe 5 en 17 y cuánto sobra?',exp:'5 cabe 3 veces en 17 (15) y sobran <b>2</b>. Ese residuo es el resultado de %.'},
   {tipo:'op',q:'<p>Para guardar el <b>nombre</b> de un aprendiz en C++, ¿qué tipo de dato usas?</p>',o:['int','char','string','bool'],a:2,hint:'Un nombre tiene varios caracteres.',exp:'Se usa <b>string</b>, que guarda texto. <code>char</code> solo guarda un carácter.'},
   {tipo:'num',q:'<p>En C++: <code>int a = 7, b = 2;</code> ¿Cuánto vale <code>a / b</code>?</p>',a:3,hint:'Cuando ambos operandos son int, C++ hace división entera y descarta los decimales.',exp:'Como a y b son <code>int</code>, la división es entera: 7 / 2 = <b>3</b> (se pierde el .5). Para obtener 3.5 al menos uno debe ser double: <code>7.0 / 2</code>.'}
  ]},
 {id:'t3',nombre:'Condicionales',
  intro:`<p>Una <b>decisión</b> evalúa una condición que solo puede ser <b>verdadera</b> o <b>falsa</b> y, según el resultado, sigue un camino u otro.</p><p>Operadores relacionales: <code>==</code> igual, <code>!=</code> diferente, <code>&lt; &gt; &lt;= &gt;=</code>. Operadores lógicos: <code>&amp;&amp;</code> (Y: ambas verdaderas), <code>||</code> (O: al menos una) y <code>!</code> (NO: invierte).</p><pre>si (condición) entonces\n    acciones si es verdadera\nsino\n    acciones si es falsa</pre>`,
  ej:[
   {tipo:'op',q:'<p>¿Qué se muestra si <code>edad = 18</code>?</p><pre>si (edad >= 18) entonces\n    mostrar "Mayor de edad"\nsino\n    mostrar "Menor de edad"</pre>',o:['Mayor de edad','Menor de edad','Nada','Ambos mensajes'],a:0,hint:'>= significa “mayor o igual”. ¿18 es mayor o igual que 18?',exp:'18 >= 18 es <b>verdadero</b>, por eso se muestra “Mayor de edad”. Solo se ejecuta uno de los dos caminos.'},
   {tipo:'op',q:'<p>¿Cuál es el resultado de <code>(5 > 3) Y (2 > 4)</code>?</p>',o:['Verdadero','Falso'],a:1,hint:'El operador Y (&&) solo es verdadero si ambas condiciones lo son.',exp:'5 > 3 es verdadero, pero 2 > 4 es falso. Con Y basta una falsa para que todo sea <b>falso</b>.'},
   {tipo:'op',q:'<p>¿Qué condición permite saber si un número <code>n</code> es <b>par</b>?</p>',o:['n / 2 == 0','n % 2 == 0','n % 2 == 1','n == 2'],a:1,hint:'Un número par no deja residuo al dividirlo entre 2.',exp:'<code>n % 2 == 0</code>: si el residuo de dividir entre 2 es cero, el número es par.'},
   {tipo:'txt',q:'<p>¿Qué mensaje se muestra si <code>nota = 3.2</code>?</p><pre>si nota >= 4.5 entonces mostrar "Excelente"\nsino si nota >= 3.0 entonces mostrar "Aprobado"\nsino mostrar "Reprobado"</pre><p>Escribe el mensaje.</p>',a:['aprobado'],hint:'Evalúa las condiciones en orden: ¿3.2 es mayor o igual a 4.5? ¿Y a 3.0?',exp:'3.2 >= 4.5 es falso; se pasa a la siguiente condición: 3.2 >= 3.0 es verdadero, así que se muestra <b>Aprobado</b> y no se evalúa nada más.'}
  ]},
 {id:'t4',nombre:'Ciclos',
  intro:`<p>Un <b>ciclo</b> repite un grupo de instrucciones mientras se cumpla una condición.</p><ul><li><b>Mientras (while):</b> evalúa la condición <i>antes</i> de cada repetición; puede no ejecutarse nunca.</li><li><b>Hacer-mientras (do-while):</b> evalúa <i>después</i>; se ejecuta al menos una vez.</li><li><b>Para (for):</b> usa un contador con inicio, fin e incremento.</li></ul><p>Un <b>contador</b> aumenta de a uno (<code>i = i + 1</code>); un <b>acumulador</b> suma valores (<code>suma = suma + x</code>). Si la condición nunca se vuelve falsa, se produce un <b>ciclo infinito</b>.</p>`,
  ej:[
   {tipo:'num',q:'<p>¿Cuántas veces se ejecuta el cuerpo del ciclo?</p><pre>i = 1\nmientras (i <= 5)\n    i = i + 1</pre>',a:5,hint:'Cuenta los valores de i para los que la condición es verdadera: 1, 2, …',exp:'Se ejecuta con i = 1, 2, 3, 4 y 5: <b>5 veces</b>. Cuando i llega a 6 la condición es falsa y el ciclo termina.'},
   {tipo:'num',q:'<p>¿Cuál es el valor final de <code>suma</code>?</p><pre>suma = 0\npara i desde 1 hasta 4\n    suma = suma + i</pre>',a:10,hint:'Es un acumulador: 0 + 1 + 2 + …',exp:'0 + 1 + 2 + 3 + 4 = <b>10</b>. La variable suma acumula cada valor de i.'},
   {tipo:'op',q:'<p>¿Qué ciclo garantiza que su cuerpo se ejecute <b>al menos una vez</b>?</p>',o:['while (mientras)','for (para)','do-while (hacer-mientras)','Ninguno'],a:2,hint:'Piensa en cuál revisa la condición al final.',exp:'El <b>do-while</b> ejecuta primero el cuerpo y luego evalúa la condición, por eso se ejecuta mínimo una vez. Es útil, por ejemplo, para menús.'},
   {tipo:'op',q:'<p>¿Qué problema tiene este algoritmo?</p><pre>i = 10\nmientras (i > 0)\n    mostrar i</pre>',o:['No muestra nada','Es un ciclo infinito','Muestra del 10 al 1','Error de sintaxis'],a:1,hint:'¿Cambia el valor de i dentro del ciclo?',exp:'Es un <b>ciclo infinito</b>: i nunca cambia, así que i > 0 siempre es verdadero. Falta <code>i = i - 1</code> dentro del ciclo.'}
  ]},
 {id:'t5',nombre:'Prueba de escritorio',
  intro:`<p>La <b>prueba de escritorio</b> consiste en ejecutar el algoritmo “a mano”, línea por línea, anotando en una tabla cómo cambia cada variable. Sirve para encontrar errores <i>antes</i> de programar.</p><pre>Paso | a | b\n  1  | 2 | -\n  2  | 2 | 3\n ...</pre><p>Consejo: en el simulador de diagramas, el botón <b>Paso a paso</b> hace esta prueba por ti y muestra la tabla de variables.</p>`,
  ej:[
   {tipo:'num',q:'<p>¿Cuál es el valor final de <code>b</code>?</p><pre>a = 2\nb = 3\na = a + b\nb = a * b</pre>',a:15,hint:'Después de la tercera línea, a ya no vale 2.',exp:'a = 2, b = 3, luego a = 2 + 3 = 5 y b = 5 × 3 = <b>15</b>. Se usa el valor más reciente de a.'},
   {tipo:'num',q:'<p>¿Cuál es el valor final de <code>y</code>?</p><pre>x = 4\ny = 0\nmientras (x > 0)\n    y = y + x\n    x = x - 2</pre>',a:6,hint:'Haz la tabla: x toma los valores 4, 2 y 0.',exp:'Vuelta 1: y = 4, x = 2. Vuelta 2: y = 6, x = 0. Como 0 > 0 es falso, termina con y = <b>6</b>.'},
   {tipo:'num',q:'<p>¿Qué muestra este código C++?</p><pre>int c = 0;\nfor (int i = 0; i < 10; i += 3) {\n    c++;\n}\ncout << c;</pre>',a:4,hint:'Lista los valores que toma i: empieza en 0 y aumenta de 3 en 3 mientras sea menor que 10.',exp:'i toma los valores 0, 3, 6 y 9 (12 ya no cumple). El ciclo se ejecuta 4 veces, así que muestra <b>4</b>.'},
   {tipo:'num',q:'<p>¿Qué muestra este código C++?</p><pre>int n = 1234, s = 0;\nwhile (n > 0) {\n    s += n % 10;\n    n /= 10;\n}\ncout << s;</pre>',a:10,hint:'n % 10 toma el último dígito y n /= 10 lo elimina.',exp:'Suma los dígitos: 4 + 3 + 2 + 1 = <b>10</b>. Es un patrón clásico para recorrer los dígitos de un número.'}
  ]}
];

const CPP_HEAD='#include <iostream>\nusing namespace std;\n\n';
const CPP_RETOS=[
 {id:'c1',t:'Hola, ADSO',conc:'cout, endl',d:'<p>Escribe tu primer programa: debe mostrar en pantalla el mensaje <b>Hola, ADSO</b> seguido de un salto de línea.</p>',
  tpl:CPP_HEAD+'int main() {\n    // Muestra el mensaje con cout\n    \n    return 0;\n}\n',
  sol:CPP_HEAD+'int main() {\n    cout << "Hola, ADSO" << endl;\n    return 0;\n}\n',
  tests:[{in:'',ex:['hola','adso']}]},
 {id:'c2',t:'Suma de dos enteros',conc:'int, cin, operadores',d:'<p>Lee dos números enteros y muestra su suma.</p><pre>Entrada: 4 6\nSalida:  La suma es: 10</pre>',
  tpl:CPP_HEAD+'int main() {\n    int a, b;\n    // 1. Lee a y b con cin\n    \n    // 2. Muestra la suma\n    \n    return 0;\n}\n',
  sol:CPP_HEAD+'int main() {\n    int a, b;\n    cout << "Ingrese dos numeros: ";\n    cin >> a >> b;\n    cout << "La suma es: " << a + b << endl;\n    return 0;\n}\n',
  tests:[{in:'4 6',ex:['10']},{in:'-3 5',ex:['2']}]},
 {id:'c3',t:'Promedio de tres notas',conc:'double, precedencia',d:'<p>Lee tres notas (pueden tener decimales) y muestra su promedio. Cuidado con los paréntesis.</p><pre>Entrada: 3 4 4\nSalida:  Promedio: 3.66667</pre>',
  tpl:CPP_HEAD+'int main() {\n    double n1, n2, n3;\n    // Lee las tres notas y calcula el promedio\n    \n    return 0;\n}\n',
  sol:CPP_HEAD+'int main() {\n    double n1, n2, n3;\n    cout << "Ingrese tres notas: ";\n    cin >> n1 >> n2 >> n3;\n    double promedio = (n1 + n2 + n3) / 3;\n    cout << "Promedio: " << promedio << endl;\n    return 0;\n}\n',
  tests:[{in:'3 4 4',ex:['3.66667']},{in:'5 4.5 4',ex:['4.5']}]},
 {id:'c4',t:'Par o impar',conc:'if / else, %',d:'<p>Lee un número entero y muestra <b>par</b> o <b>impar</b>.</p><pre>Entrada: 7\nSalida:  El numero es impar</pre>',
  tpl:CPP_HEAD+'int main() {\n    int n;\n    cin >> n;\n    // Usa if / else con el operador %\n    \n    return 0;\n}\n',
  sol:CPP_HEAD+'int main() {\n    int n;\n    cout << "Ingrese un numero: ";\n    cin >> n;\n    if (n % 2 == 0) {\n        cout << "El numero es par" << endl;\n    } else {\n        cout << "El numero es impar" << endl;\n    }\n    return 0;\n}\n',
  tests:[{in:'7',ex:['impar']},{in:'10',ex:['par']},{in:'0',ex:['par']}]},
 {id:'c5',t:'Mayor de tres números',conc:'if anidado, &&',d:'<p>Lee tres números enteros y muestra el mayor.</p><pre>Entrada: 3 9 5\nSalida:  El mayor es: 9</pre>',
  tpl:CPP_HEAD+'int main() {\n    int a, b, c;\n    cin >> a >> b >> c;\n    // Compara usando if, else if y &&\n    \n    return 0;\n}\n',
  sol:CPP_HEAD+'int main() {\n    int a, b, c;\n    cin >> a >> b >> c;\n    int mayor;\n    if (a >= b && a >= c) {\n        mayor = a;\n    } else if (b >= c) {\n        mayor = b;\n    } else {\n        mayor = c;\n    }\n    cout << "El mayor es: " << mayor << endl;\n    return 0;\n}\n',
  tests:[{in:'3 9 5',ex:['9']},{in:'10 2 7',ex:['10']},{in:'1 4 8',ex:['8']}]},
 {id:'c6',t:'Tabla de multiplicar',conc:'for',d:'<p>Lee un número y muestra su tabla de multiplicar del 1 al 10.</p><pre>Entrada: 3\nSalida:  3 x 1 = 3\n         3 x 2 = 6\n         ...\n         3 x 10 = 30</pre>',
  tpl:CPP_HEAD+'int main() {\n    int n;\n    cin >> n;\n    // Usa un ciclo for de 1 a 10\n    \n    return 0;\n}\n',
  sol:CPP_HEAD+'int main() {\n    int n;\n    cin >> n;\n    for (int i = 1; i <= 10; i++) {\n        cout << n << " x " << i << " = " << n * i << endl;\n    }\n    return 0;\n}\n',
  tests:[{in:'3',ex:['3','6','9','12','15','18','21','24','27','30']},{in:'7',ex:['7','14','21','70']}]},
 {id:'c7',t:'Suma de 1 a N',conc:'while, acumulador',d:'<p>Lee un número N y muestra la suma 1 + 2 + … + N usando un ciclo <code>while</code>.</p><pre>Entrada: 100\nSalida:  La suma es: 5050</pre>',
  tpl:CPP_HEAD+'int main() {\n    int n;\n    int suma = 0;\n    int i = 1;\n    cin >> n;\n    // Ciclo while que acumule en suma\n    \n    return 0;\n}\n',
  sol:CPP_HEAD+'int main() {\n    int n;\n    int suma = 0;\n    int i = 1;\n    cin >> n;\n    while (i <= n) {\n        suma += i;\n        i++;\n    }\n    cout << "La suma es: " << suma << endl;\n    return 0;\n}\n',
  tests:[{in:'5',ex:['15']},{in:'100',ex:['5050']}]},
 {id:'c8',t:'Calculadora con switch',conc:'char, switch, do-while opcional',d:'<p>Lee una operación con el formato <code>número operador número</code> (por ejemplo <code>8 * 2</code>) y muestra el resultado. Soporta <code>+ - * /</code>; si el divisor es 0 muestra un mensaje de error y si el operador no existe, “Operador no valido”.</p>',
  tpl:CPP_HEAD+'int main() {\n    double a, b;\n    char op;\n    cin >> a >> op >> b;\n    // Usa switch (op) con un case por operador\n    \n    return 0;\n}\n',
  sol:CPP_HEAD+'int main() {\n    double a, b;\n    char op;\n    cin >> a >> op >> b;\n    switch (op) {\n        case \'+\': cout << a + b << endl; break;\n        case \'-\': cout << a - b << endl; break;\n        case \'*\': cout << a * b << endl; break;\n        case \'/\':\n            if (b != 0) cout << a / b << endl;\n            else cout << "Error: division entre cero" << endl;\n            break;\n        default: cout << "Operador no valido" << endl;\n    }\n    return 0;\n}\n',
  tests:[{in:'8 * 2',ex:['16']},{in:'9 / 3',ex:['3']},{in:'5 - 7',ex:['-2']},{in:'4 / 0',ex:['error']}]}
];
