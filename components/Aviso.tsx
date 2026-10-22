export const EMAIL_REMOCAO = "juningyn@gmail.com";

export function AvisoFaixa() {
  return (
    <p className="aviso-faixa">
      STLs adquiridos por rateio comunitário, sem fins lucrativos.{" "}
      <a href="#aviso-legal">Leia o aviso legal</a>
    </p>
  );
}

export function AvisoLegal() {
  return (
    <footer className="aviso-legal" id="aviso-legal">
      <h2>Aviso legal</h2>
      <p>
        Os modelos listados aqui foram adquiridos por meio de <strong>rateio comunitário, sem fins
        lucrativos</strong>. Este site apenas cataloga os modelos e indica quem participou de cada
        compra: nenhum arquivo STL é hospedado ou distribuído por aqui.
      </p>
      <p>
        Os direitos de cada modelo pertencem ao seu criador. Antes de qualquer uso comercial, como
        vender impressões, <strong>consulte a licença do autor original</strong>.
      </p>
      <p>
        O uso dos arquivos é de <strong>inteira responsabilidade de quem os adquire e baixa</strong>.
      </p>
      <p>
        É o criador de algum destes modelos e quer que ele seja retirado? Escreva para{" "}
        <a href={`mailto:${EMAIL_REMOCAO}?subject=Remo%C3%A7%C3%A3o%20de%20STL%20-%20rateiosstl`}>
          {EMAIL_REMOCAO}
        </a>{" "}
        informando o nome do modelo, e ele será removido.
      </p>
    </footer>
  );
}
