# Portal de Garantías Driven (maqueta)

Sistema web para que los distribuidores carguen y sigan garantías de productos Driven, y para que Driven las gestione desde un solo lugar. Cada distribuidor puede tener varias sucursales, y las garantías de cada sucursal quedan separadas.

## Cómo usarlo

Requisitos: Node.js 20 o superior (ya instalado).

```bash
npm install        # solo la primera vez
npm run db:reset   # crea la base de datos y carga datos de demostración
npm run dev        # levanta el sistema en http://localhost:3000
```

En la pantalla de ingreso hay botones "Demo · entrar como" para entrar con un clic. Usuarios de demostración (contraseña `demo1234` para todos):

| Email | Quién es | Qué ve |
| --- | --- | --- |
| admin@iturria.com.ar | Gerencia de ITURRIA | Las 3 sucursales, y gestiona sucursales y usuarios |
| mdp@iturria.com.ar | ITURRIA Mar del Plata | Solo las garantías de Mar del Plata |
| bsas@iturria.com.ar | ITURRIA Buenos Aires | Solo las garantías de Buenos Aires |
| bahia@iturria.com.ar | ITURRIA Bahía Blanca | Solo las garantías de Bahía Blanca |
| admin@nortepartes.com | Otro distribuidor (Tucumán) | Solo lo suyo |
| tecnico@driven.com.ar | Servicio técnico Driven | Todas las garantías |
| admin@driven.com.ar | Administración Driven | Todo, más distribuidores, productos y equipo |

Otros comandos:

- `npm run db:reset`: borra todo y vuelve a cargar los datos de demostración (también sirve `node prisma/seed.mjs`).
- `npm run db:studio`: abre un visor de la base de datos en el navegador.

## Qué incluye

**Para el distribuidor**

- **Inicio claro:** qué necesita su atención, qué está en curso y las últimas respuestas de Driven. La gerencia ve además un resumen por sucursal.
- **Carga paso a paso:** sucursal → producto → falla → cliente → comprobantes → revisar y enviar. Calcula sola si está dentro de los 2 años de garantía.
- **"¿Qué sigue?"** en cada garantía: barra de progreso y explicación en criollo de lo que pasa y lo que falta.
- **Responder a Driven** directo desde la garantía cuando pide información; al responder vuelve sola a revisión.
- **Novedades:** marca lo que Driven cambió desde la última vez que entraste.
- **Comprobante imprimible** para pegar en la caja del equipo.
- **Descarga de la nota de crédito** en PDF cuando Driven la sube.

**Para Driven**

- **Bandeja de trabajo** por columnas (Nuevas, Equipo recibido, En revisión, Esperando al distribuidor, Aprobadas), con demoras marcadas en rojo.
- **Botones según el estado:** cada garantía muestra solo las acciones posibles (Recibimos el equipo, Empezar revisión, Aprobar, Pedir información, Rechazar, Entregar resolución) y pide solo los datos necesarios.
- **Resolución:** cambio de producto, reparación o nota de crédito (motivo, número, monto y PDF).
- **Indicadores:** abiertas, demoradas, resueltas en el mes, días promedio, fallas más frecuentes y garantías por distribuidor.
- **Administración:** distribuidores con sus sucursales y usuarios, productos y equipo Driven.

**Sucursales**

- Cada usuario del distribuidor se asigna a una sucursal o a "Todas las sucursales" (gerencia).
- Un usuario de sucursal solo ve y carga garantías de su sucursal; la gerencia ve todas y puede filtrar.
- La gerencia da de alta sucursales y usuarios desde "Sucursales y usuarios"; Driven también puede hacerlo desde la ficha del distribuidor.

## Estructura

```
prisma/schema.prisma          Modelo de datos
prisma/seed.mjs               Datos de demostración (ITURRIA con 3 sucursales)
src/app/login                 Pantalla de ingreso
src/app/(app)/inicio          Inicio del distribuidor y bandeja de Driven
src/app/(app)/garantias       Listado, carga paso a paso y detalle
src/app/(app)/empresa         Sucursales y usuarios (gerencia del distribuidor)
src/app/(app)/administracion  Distribuidores, productos y equipo Driven
src/app/imprimir              Comprobante para imprimir
src/app/api/archivos          Descarga protegida de documentos
src/lib                       Autenticación, permisos, novedades, constantes
public/logo-driven.png        Logo oficial de Driven
uploads/                      Archivos subidos (no se versiona)
```

## Tecnología

Next.js 15 + React 19 + TypeScript, Tailwind CSS, Prisma con SQLite (archivo local `prisma/garantias.db`).
Para producción se recomienda cambiar a PostgreSQL y guardar archivos en un almacenamiento en la nube.
