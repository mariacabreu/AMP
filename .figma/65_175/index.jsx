import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.cadastroCarro}>
      <img
        src="../image/mow26h3z-izc06t4.png"
        className={styles.pItchprojetoandreza1}
      />
      <div className={styles.frame1}>
        <p className={styles.marcaEModeloDoCarro}>Marca e Modelo do Carro</p>
        <div className={styles.caixaEmail} />
        <p className={styles.anoDoCarro}>Ano do Carro&nbsp;</p>
        <div className={styles.caixaEmail} />
        <p className={styles.anoDoCarro}>Câmbio</p>
        <div className={styles.caixaEmail} />
        <p className={styles.quilometragem}>Quilometragem</p>
        <div className={styles.caixaEmail} />
        <div className={styles.selectField}>
          <div className={styles.select}>
            <p className={styles.value}>Combustível</p>
            <img
              src="../image/mow26h3y-ontv9zp.svg"
              className={styles.chevronDown}
            />
          </div>
        </div>
        <div className={styles.button2}>
          <p className={styles.button}>Cadastrar Veículo</p>
        </div>
      </div>
    </div>
  );
}

export default Component;
