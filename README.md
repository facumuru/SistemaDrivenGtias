# Portal de Garantías Driven (maqueta)

Sistema web para que los distribuidores carguen y sigan garantías de productos Driven, y para que Driven las gestione desde un solo lugar.

## Cómo usarlo

Requisitos: Node.js 20 o superior (ya instalado).

```bash
npm install        # solo la primera vez
npm run db:reset   # crea la base de datos y carga datos de demostración
npm run dev        # levanta el sistema en http://localhost:3000
```

Usuarios de demostración (contraseña `demo1234` para todos):

| Email | Rol |
| --- | --- |
| admin@driven.com.ar | Administrador Driven |
| tecnico@driven.com.ar | Técnico Driven |
| admin@midistribuidora.com | Administrador del distribuidor |
| ventas@midistribuidora.com | Operador del distribuidor |
| admin@nortepartes.com | Administrador de otro distribuidor |

Otros comandos:

- `npm run db:studio`: abre un visor de la base de datos en el navegador.
- `npm run db:reset`: borra todo y vuelve a cargar los datos de demostración.

## Qué incluye

- **Login con 4 roles.** Driven (administrador y técnico) ve todo; cada distribuidor ve solo sus garantías.
- **Carga de garantía.** Producto, n° de serie, fecha de compra con cálculo automático de vigencia, tipo de falla, cliente final, factura y fotos o videos.
- **Seguimiento de estados.** Cargada → Equipo recibido → En revisión → Aprobada/Rechazada → Finalizada, más "Info requerida".
- **Resolución.** Cambio de producto, reparación o nota de crédito (con motivo, número, monto y PDF descargable por el distribuidor).
- **Chat por garantía** con adjuntos. Si Driven pide información y el distribuidor responde, la garantía vuelve sola a revisión.
- **Historial completo** de quién hizo cada cambio y cuándo.
- **Panel** con indicadores, fallas más frecuentes y garantías por distribuidor.
- **Administración.** Alta de distribuidores, productos y usuarios. El administrador de cada distribuidor maneja su propio equipo.

## Estructura

```
prisma/schema.prisma      Modelo de datos
prisma/seed.mjs           Datos de demostración
src/app/login             Pantalla de ingreso
src/app/(app)/panel       Panel principal
src/app/(app)/garantias   Listado, carga y detalle de garantías
src/app/(app)/administracion  Distribuidores, productos y usuarios
src/app/api/archivos      Descarga protegida de documentos
src/lib                   Autenticación, base de datos, constantes
uploads/                  Archivos subidos (no se versiona)
```

## Tecnología

Next.js 15 + React 19 + TypeScript, Tailwind CSS, Prisma con SQLite (archivo local `prisma/garantias.db`).
Para producción se recomienda cambiar a PostgreSQL y guardar archivos en un almacenamiento en la nube.
