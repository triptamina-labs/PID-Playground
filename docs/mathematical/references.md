# Referencias Bibliográficas - PID Playground

## Bibliografía Técnica

### Libros Fundamentales

#### Control de Sistemas Dinámicos
1. **Franklin, G.F., Powell, J.D., & Emami-Naeini, A.** (2015). *Feedback Control of Dynamic Systems* (8th ed.). Pearson.
   - **Capítulo 3**: Discretización de sistemas continuos
   - **Capítulo 4**: Análisis de respuesta temporal
   - **Capítulo 6**: Diseño de controladores PID
   - **Relevancia**: Base matemática para discretización exacta

2. **Åström, K.J. & Hägglund, T.** (2006). *Advanced PID Control*. ISA - The Instrumentation, Systems, and Automation Society.
   - **Capítulo 2**: Métricas de rendimiento y criterios de diseño
   - **Capítulo 3**: Derivada filtrada y kick derivativo
   - **Capítulo 6**: Anti-windup y saturación
   - **Relevancia**: Implementación industrial de PID

3. **Seborg, D.E., Edgar, T.F., & Mellichamp, D.A.** (2016). *Process Dynamics and Control* (4th ed.). Wiley.
   - **Capítulo 5**: Modelos de primer orden y tiempo muerto
   - **Capítulo 12**: Métricas de rendimiento de control
   - **Capítulo 15**: Sintonía de controladores PID
   - **Relevancia**: Aplicación a procesos industriales

#### Control Digital y Discretización
4. **Åström, K.J. & Wittenmark, B.** (2011). *Computer-Controlled Systems: Theory and Design* (3rd ed.). Dover Publications.
   - **Sección 2.3**: Métodos de discretización exacta
   - **Sección 3.4**: Estabilidad de sistemas discretos
   - **Sección 4.2**: Implementación de controladores digitales
   - **Relevancia**: Fundamentos de control digital

5. **Visioli, A.** (2006). *Practical PID Control*. Springer.
   - **Capítulo 2**: Derivada filtrada y kick derivativo
   - **Capítulo 3**: Anti-windup y saturación
   - **Capítulo 4**: Sintonía automática de PID
   - **Relevancia**: Implementación práctica de PID

### Artículos Científicos

#### Discretización Exacta
6. **Franklin, G.F. & Powell, J.D.** (1980). "Digital Control of Dynamic Systems." *Addison-Wesley*.
   - **Tema**: Comparación de métodos de discretización
   - **Resultado**: Ventajas de discretización exacta vs Euler

#### Anti-windup y Derivada Filtrada
7. **Hägglund, T.** (1999). "Automatic Detection of Oscillating Control Loops." *Control Engineering Practice*, 7(8), 1003-1009.
   - **Tema**: Detección automática de oscilaciones
   - **Resultado**: Métodos para identificar problemas de control
   - **Relevancia**: Validación de métricas de rendimiento

8. **Åström, K.J. & Hägglund, T.** (1984). "Automatic Tuning of Simple Regulators with Specifications on Phase and Amplitude Margins." *Automatica*, 20(5), 645-651.
   - **Tema**: Sintonía automática de controladores
   - **Resultado**: Métodos de Ziegler-Nichols y Cohen-Coon
   - **Relevancia**: Presets y sintonía automática

## Estándares Industriales

### ISA (International Society of Automation)

#### Terminología y Definiciones
9. **ISA Standard 51.1-1979** (1979). *Process Instrumentation Terminology*.
   - **Sección**: Definiciones de control automático
   - **Contenido**: Terminología estándar para control de procesos
   - **Relevancia**: Definiciones de métricas y parámetros

#### Control de Procesos
10. **ISA Standard 88.01-1995** (1995). *Batch Control Part 1: Models and Terminology*.
    - **Sección**: Control de lotes y secuencias
    - **Contenido**: Modelos para control de procesos por lotes
    - **Relevancia**: Aplicación a hornos industriales

### IEC (International Electrotechnical Commission)

#### Control Industrial
11. **IEC 61131-3** (2013). *Programmable controllers - Part 3: Programming languages*.
    - **Sección**: Lenguajes de programación para PLCs
    - **Contenido**: Implementación de controladores PID
    - **Relevancia**: Estándares de implementación industrial

### IEEE (Institute of Electrical and Electronics Engineers)

#### Control Digital
12. **IEEE Standard 754-2008** (2008). *IEEE Standard for Floating-Point Arithmetic*.
    - **Sección**: Aritmética de punto flotante
    - **Contenido**: Precisión numérica en control digital
    - **Relevancia**: Validación de precisión numérica

## Recursos Educativos

### Tutoriales y Guías

#### Control PID Básico
13. **Ogata, K.** (2010). *Modern Control Engineering* (5th ed.). Prentice Hall.
    - **Capítulo 8**: Controladores PID
    - **Contenido**: Fundamentos y sintonía básica
    - **Nivel**: Undergraduate
    - **Relevancia**: Material educativo introductorio

#### Simulación y Modelado
14. **Ljung, L.** (1999). *System Identification: Theory for the User* (2nd ed.). Prentice Hall.
    - **Capítulo 4**: Modelos de primer orden
    - **Capítulo 7**: Identificación de sistemas con tiempo muerto
    - **Relevancia**: Validación de modelos FOPDT

### Recursos en Línea

#### Cursos y Tutoriales
15. **MIT OpenCourseWare** (2006). *Introduction to Control System Design*.
    - **Curso**: 6.302 Feedback Systems
    - **Contenido**: Control PID y análisis de estabilidad
    - **URL**: https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-302-feedback-systems-fall-2006/
    - **Relevancia**: Material educativo de alta calidad

16. **Control Tutorials for MATLAB and Simulink** (2015). *PID Tutorial*.
    - **Contenido**: Tutorial interactivo de control PID
    - **URL**: http://ctms.engin.umich.edu/CTMS/index.php?example=Introduction&section=ControlPID
    - **Relevancia**: Ejemplos prácticos y simulaciones

#### Herramientas de Simulación
17. **MathWorks** (2023). *PID Controller Design*.
    - **Contenido**: Herramientas de diseño de controladores PID
    - **URL**: https://www.mathworks.com/help/control/pid-controller-design.html
    - **Relevancia**: Validación de resultados


## Recursos de Validación

### Casos de Prueba Estándar

#### Respuesta al Escalón
21. **Franklin, G.F., et al.** (2015). *Feedback Control of Dynamic Systems*.
    - **Ejemplo 3.1**: Respuesta al escalón de sistema de primer orden
    - **Resultado**: Fórmulas analíticas para validación
    - **Relevancia**: Casos de prueba analíticos

#### Métricas de Rendimiento
22. **Åström, K.J. & Hägglund, T.** (2006). *Advanced PID Control*.
    - **Capítulo 2**: Definiciones de overshoot, settling time
    - **Resultado**: Métricas estándar de la industria
    - **Relevancia**: Cálculo de métricas

### Herramientas de Validación

#### Software de Simulación
23. **MATLAB/Simulink** (2023). *Control System Toolbox*.
    - **Contenido**: Herramientas de análisis de control
    - **Relevancia**: Validación de resultados del simulador

24. **Python Control** (2023). *Python Control Systems Library*.
    - **Contenido**: Biblioteca de control para Python
    - **URL**: https://python-control.readthedocs.io/
    - **Relevancia**: Validación independiente

## Recursos para Instructores

### Material Didáctico

#### Ejercicios y Problemas
25. **Dorf, R.C. & Bishop, R.H.** (2017). *Modern Control Systems* (14th ed.). Pearson.
    - **Capítulo 7**: Control PID
    - **Contenido**: Problemas y ejercicios prácticos
    - **Relevancia**: Material para cursos universitarios

#### Laboratorios Virtuales
26. **University of Michigan** (2020). *Virtual Control Laboratory*.
    - **Contenido**: Laboratorios virtuales de control
    - **URL**: http://ctms.engin.umich.edu/CTMS/index.php?example=Introduction&section=ControlPID
    - **Relevancia**: Comparación con otros simuladores

### Evaluación y Testing

#### Estándares de Calidad
27. **IEEE Standard 1012-2016** (2016). *IEEE Standard for System, Software, and Hardware Verification and Validation*.
    - **Sección**: Validación de software de simulación
    - **Contenido**: Criterios de calidad para simuladores
    - **Relevancia**: Estándares de validación

## Enlaces Útiles

### Comunidades y Foros
28. **Control.com** (2023). *Process Control Forum*.
    - **URL**: https://control.com/forums/
    - **Contenido**: Discusiones sobre control de procesos
    - **Relevancia**: Comunidad de práctica

29. **Stack Overflow** (2023). *Control Theory Tag*.
    - **URL**: https://stackoverflow.com/questions/tagged/control-theory
    - **Contenido**: Preguntas y respuestas sobre control
    - **Relevancia**: Solución de problemas técnicos

### Repositorios de Código
30. **GitHub** (2023). *Control Systems Repositories*.
    - **URL**: https://github.com/topics/control-systems
    - **Contenido**: Implementaciones de control
    - **Relevancia**: Comparación de implementaciones

