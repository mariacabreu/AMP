import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.planejamentoDeViagem}>
      <div className={styles.frame24}>
        <img
          src="../image/mrb9uzo0-iebkd7g.png"
          className={styles.pItchprojetoandreza1}
        />
        <div className={styles.group336}>
          <div className={styles.group334}>
            <img src="../image/mrb9uzo0-rw4fpr2.png" className={styles.image28} />
          </div>
          <img src="../image/mrb9uzo0-tls21rc.png" className={styles.image29} />
        </div>
      </div>
      <p className={styles.pLanejesuaviagem}>PLANEJE SUA VIAGEM</p>
      <div className={styles.image73} />
      <img src="../image/mrb9uzo1-l69w7l0.png" className={styles.image66} />
      <div className={styles.frame1}>
        <div className={styles.group330}>
          <p className={styles.partida}>Partida</p>
          <div className={styles.caixaEmail}>
            <p className={styles.localDePartida}>Local de partida</p>
          </div>
        </div>
        <div className={styles.group331}>
          <p className={styles.destino}>Destino</p>
          <div className={styles.caixaEmail2}>
            <p className={styles.praOnde}>Pra onde?</p>
          </div>
        </div>
        <p className={styles.quilometragem}>Quilometragem:</p>
        <div className={styles.caixaEmail3}>
          <p className={styles.a82Km}>8.2 KM</p>
          <div className={styles.button2}>
            <p className={styles.button}>Calcular Km</p>
          </div>
        </div>
        <div className={styles.button3}>
          <p className={styles.button}>Gerar Relatório</p>
        </div>
      </div>
      <div className={styles.barraDeNavegaO}>
        <div className={styles.home3}>
          <img src="../image/mrb9uznv-gf33qpg.svg" className={styles.home} />
          <p className={styles.home2}>Home</p>
        </div>
        <div className={styles.home3}>
          <img src="../image/mrb9uznv-j0rqfhw.svg" className={styles.home} />
          <p className={styles.home2}>Relatório</p>
        </div>
        <div className={styles.home4}>
          <div className={styles.iconPeAs}>
            <p className={styles.peAs}>Peças</p>
            <img src="../image/mrb9uznv-r8qyn57.svg" className={styles.settings} />
            <img src="../image/mrb9uznv-smr7na9.svg" className={styles.group351} />
          </div>
          <p className={styles.home2}>Peças</p>
        </div>
        <div className={styles.home3}>
          <img src="../image/mrb9uznv-qvq3u1p.svg" className={styles.home} />
          <p className={styles.home2}>Checklist</p>
        </div>
        <div className={styles.home3}>
          <img src="../image/mrb9uznv-f19nlyn.svg" className={styles.home} />
          <p className={styles.home2}>Config</p>
        </div>
      </div>
      <img
        src="../image/mrb9uzo1-rxurtyu.png"
        className={styles.peopleInCarSideView}
      />
      <img src="../image/mrb9uzo1-epm8o5o.png" className={styles.image72} />
    </div>
  );
}

export default Component;
