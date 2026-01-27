PROMPT: Estoy generando la documentacion para el proyecto, concretamente para el frontend, en docs/user. Mi idea es generar un archivo raiz, un archivo principal, llamado FRONTEND-DOCUMENTATION, que introduzca el frontend, lo explique de manera bonita y demas, y luego introduzca las diferentes features o caracteristicas que tiene. Ya hay generada en ese documento una version cutre hecha, quiero que lo pongas en ingles, y que le des un buen formato Markdown apropiado, y generes los enlaces a los otros documentos de manera coherente, porque luego, al mismo nivel, esta la carpeta de features, la cual tiene la documentacion de todas las caracteristicas, algunas de primer nivel, y otras divididas en las caracteristicas especificas de los KITs. Con interpretar bien el documento raiz de la documentacion ya podras entener como tienes que hacer las cosas. Cada subdocumento tambien tiene mas o menos lo que quiero decir. Estructurame el contenido de todos estos documentos de features, para que yo luego vaya insertando capturas de pantalla y demas (preparame el sitio para dejar dichas capturas).

Guia de uso del Frontend del Industry Core Hub.

Este documento sirve como guia para comprender y aprender a usar el frontend del Industry Core Hub (ICHub).
El ICHub es una herramienta que facilita el uso de los componentes y KITs del espacio de datos y evita a los usuarios entrar en configuraciones y usos complejos. El frontend es ese componente que te permite hacer uso de dichos componentes de manera sencilla e intuitiva, con pantallas completas y practicas para el usuario final, siempre siguiendo los criterios y estandares de diseño de interfaces, y pensando sobre todo en la practicidad y usabilidad para nuestro usuario final.

Este frontend permite no solo realizar funciones propias del Industry Core Hub como compartir y consumir publicaciones del sector automotriz en el espacio de datos, sino que tambien esta enfocado en un proyecto escalable enfocado a KITs, de tal manera que de manera progresiva se van implementando nuevas funcionalidades y caracteristicas basadas en los KITs de Tractus-X [insertar enlace].

Es por eso que esta documentacion se divide en otras subcategorias, las cuales cada una explica como usar y para que cada una de las caracteristicas del Industry Core Hub, a la vez que se divide en KITs. 
Actualmente se contemplan 2 KITs y sus siguientes caracteristicas: 
* Industry Core Hub KIT:
    * Catalog Parts: Creas, registras y publicas Catalogs Parts en el espacio de datos
    * Serialized Parts: Creas, asignas a un Catalog Part, registras y publicas Serialized Parts en el espacio de datos 
    * Dataspace Discovery: Consumes los Catalog y Serialized Parts publicados de un contacto de tu Contact List
    * Contact List: Defines los participantes del espacio de datos con los que quieras interactuar: Nombre y BPNL
* Eco Pass KIT:
    * Passport Provision & Management: Haz uso de un Wizard que te guia en el proceso de crecion de un Data Product Passport en el espacio de datos
    * Passport Consumption & Visualization: Consume y visualiza un Pasaport Digital ya publicado en el espacio de datos mediante su QR o su identificador

Ademas de eso, el ICHub cuenta con otras caracteristicas y pantallas mas genericas propias del Industry Core Hub:
* KIT Features: Habilita y deshabilita caracteristicas en tu aplicacion basadas en las funcionalidades de los KITs
* Submodel Creator: Crea y registra de manera guiada un submodelo para una de tus piezas con una interfaz guiada de creacion de submodelo basada en los JSON Schemas de Tractus-X
* Policy Management: Genera, visualiza, y gestiona las politicas definidas en tu espacio de datos haciendo uso de un Policy Builder
* System Management: Conecta, registra y gestiona los sistemas relacionados con tu Industry Core Hub

[TEMAS DE LICENCIAS Y DEMAS QUE HABRA QUE PONER]