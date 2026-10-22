import { formatarValor, formatarWhatsapp, linkEmail, linkInstagram, linkWhatsapp } from "@/lib/contato";
import type { Stl } from "@/lib/tipos";
import { IconeEmail, IconeInstagram, IconeWhatsapp } from "./Icones";

export default function CardStl({ stl, aoAmpliar }: { stl: Stl; aoAmpliar: () => void }) {
  return (
    <article className="card">
      <button className="card-foto" onClick={aoAmpliar} aria-label={`Ampliar foto de ${stl.nome}`}>
        <img src={stl.foto_url} alt={stl.nome} loading="lazy" />
      </button>
      <div className="card-corpo">
        <h3 className="card-nome">{stl.nome}</h3>
        {stl.valor != null && (
          <p className="valor">
            {formatarValor(stl.valor)} <small>no rateio</small>
          </p>
        )}
        <span className="etiqueta">{stl.categoria}</span>
        <p className="comprador">
          Comprado por <strong>{stl.comprador}</strong>
        </p>
        <div className="contatos">
          {stl.whatsapp && (
            <a className="contato whatsapp" href={linkWhatsapp(stl.whatsapp)} target="_blank" rel="noopener noreferrer" title={`WhatsApp ${formatarWhatsapp(stl.whatsapp)}`} aria-label={`WhatsApp de ${stl.comprador}`}>
              <IconeWhatsapp />
            </a>
          )}
          {stl.email && (
            <a className="contato email" href={linkEmail(stl.email)} title={stl.email} aria-label={`E-mail de ${stl.comprador}`}>
              <IconeEmail />
            </a>
          )}
          {stl.instagram && (
            <a className="contato instagram" href={linkInstagram(stl.instagram)} target="_blank" rel="noopener noreferrer" title={`@${stl.instagram}`} aria-label={`Instagram de ${stl.comprador}`}>
              <IconeInstagram />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
