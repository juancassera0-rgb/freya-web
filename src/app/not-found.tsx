import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function NotFound() {
  return (
    <div className="section">
      <div className="container" style={{ textAlign: "center" }}>
        <p className="eyebrow">404</p>
        <h1>No encontramos esta página</h1>
        <p className="lead" style={{ margin: "1rem auto" }}>
          Puede que el enlace esté desactualizado. Volvé al inicio o mirá los
          desarrollos activos.
        </p>
        <div className="btn-group" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary" href="/">
            Inicio
          </Link>
          <Link className="btn btn-secondary" href="/desarrollos">
            Desarrollos
          </Link>
        </div>
      </div>
    </div>
  );
}
