import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.pagamentoEmDBito}>
      <div className={styles.autoWrapper}>
        <img
          src="../image/mpd8uno6-uuevjo2.svg"
          className={styles.iconlyBoldArrowLeftS}
        />
        <p className={styles.cArtodedbito}>CARTÃO DE DÉBITO</p>
      </div>
      <div className={styles.autoWrapper4}>
        <div className={styles.group324}>
          <img
            src="../image/mpd8uno9-gv5zb60.png"
            className={styles.geminiGeneratedImage}
          />
          <div className={styles.group323}>
            <div className={styles.inputField} />
            <p className={styles.nDoCartO}>Nº do Cartão</p>
          </div>
          <div className={styles.autoWrapper2}>
            <div className={styles.group321}>
              <div className={styles.inputField2} />
              <p className={styles.vencimento}>Vencimento</p>
            </div>
            <div className={styles.group322}>
              <p className={styles.cVv}>CVV</p>
              <div className={styles.inputField3}>
                <img
                  src="../image/mpd8uno9-bvqs4md.png"
                  className={styles.cartO1}
                />
              </div>
            </div>
          </div>
          <div className={styles.group320}>
            <p className={styles.nomeCompleto}>Nome Completo</p>
            <div className={styles.inputField4} />
          </div>
          <div className={styles.group275}>
            <p className={styles.cPf}>CPF</p>
            <div className={styles.inputField4} />
          </div>
          <div className={styles.frame39}>
            <div className={styles.group317}>
              <p className={styles.aoClicarClicarNoBotO}>
                Ao clicar Clicar no botão a baixo voce concorda com
                nossos&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;e&nbsp;
              </p>
              <div className={styles.autoWrapper3}>
                <p className={styles.title3}>
                  <span className={styles.title}>termos</span>
                  <span className={styles.title2}>&nbsp;</span>
                </p>
                <p className={styles.title4}>Politicas de Privacidade</p>
              </div>
            </div>
            <div className={styles.button2}>
              <p className={styles.button}>Finalizar Compra&nbsp;</p>
              <img
                src="../image/mpd8uno6-csyjljf.svg"
                className={styles.checkCircle}
              />
            </div>
          </div>
        </div>
        <img src="../image/mpd8uno9-5lnfbni.png" className={styles.image66} />
      </div>
    </div>
  );
}

export default Component;
