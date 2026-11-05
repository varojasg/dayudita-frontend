# DAYUDITA 

Dayudita es una aplicación web para administrar las ventas y los créditos de una tienda de artículos de fiesta. Este repositorio contiene la interfaz utilizada por clientes, administradores de tienda y administradores del sistema para consultar productos, gestionar compras y seguir los pagos de los créditos.

## Tecnologías

![React](https://img.shields.io/badge/React_18.3.1-149ECA?style=for-the-badge&logo=react&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/Vite_5.4.14-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router_6.28-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

## Features

- Inicio de sesión y navegación según el rol del usuario.
- Vista de productos y créditos para clientes.
- Gestión de clientes y consulta de créditos para administradores de tienda.
- Simulación de compras financiadas y visualización del cronograma de cuotas.
- Registro de pagos y consulta del estado de los créditos.
- Configuración de la política crediticia de cada tienda.
- Administración de tiendas y sus estados para el administrador del sistema.
- Formularios, modales y mensajes de validación para las principales operaciones.

## Ejecución

Se necesita **Node.js y npm**, además del backend de Dayudita ejecutándose. Desde la raíz del frontend, preparar el archivo de configuración:

**Windows (CMD):**

```cmd
copy .env.example .env
```

**Linux y macOS:**

```bash
cp .env.example .env
```

El archivo `.env` debe contener la dirección de la API:

```env
VITE_API_URL=http://localhost:8080/api
```

Instalar las dependencias e iniciar el servidor de desarrollo:

```bash
npm ci
npm run dev
```

Abrir `http://localhost:5173` en el navegador. Para generar una versión de producción:

```bash
npm run build
```

Los archivos resultantes se generan en `dist/`. La configuración CORS del backend incluida en este proyecto admite el acceso desde `localhost` durante el desarrollo; para utilizar otro dominio debe ajustarse también la configuración del servidor.

## Video de demo

<img src="https://img.youtube.com/vi/JRY63zA-Ix8/maxresdefault.jpg" width="900" alt="Demo de Dayudita">

[Ver video en YouTube](https://youtu.be/JRY63zA-Ix8)

## Desarrollo

### Elección de arquitectura

Organicé la interfaz por páginas según el tipo de usuario: `client`, `store` y `system`. Separé las llamadas HTTP en `src/api/api.js`, el estado de autenticación en `AuthContext` y los componentes reutilizables en `src/components`.

Con esta estructura, los formularios y las tablas no necesitan conocer los detalles de cada endpoint. Además, las rutas protegidas comprueban el rol del usuario antes de mostrar las pantallas correspondientes. Las autorizaciones definitivas siguen siendo responsabilidad del backend.

### Decisión de tecnologías

Elegí **React** para construir una interfaz basada en componentes y actualizar las vistas después de consultar o modificar información. Utilicé **React Router** para organizar la navegación por roles y **Vite** para mantener un entorno de desarrollo sencillo.

Las solicitudes al backend se realizan mediante la **Fetch API**. Configuré el envío de cookies con `credentials: 'include'` para trabajar con la autenticación por sesión que utiliza Spring Security. También empleé **CSS** para definir el diseño de las páginas y los componentes, sin depender de una biblioteca visual adicional.

### Construcción del software

Desarrollé primero el inicio de sesión y la distribución de pantallas para cada rol. Después conecté las vistas de productos, clientes, tiendas y créditos con los endpoints del backend.

Para la gestión financiera incorporé formularios de simulación, una tabla para presentar el cronograma del método francés y pantallas para consultar el estado de las cuotas y registrar pagos. Finalmente, adapté la identidad visual de Dayudita con imágenes, iconos y personajes propios de la tienda, manteniendo una presentación coherente entre las distintas secciones.
