import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.cadastroUsuRio}>
      <img
        src="../image/mow16cuz-sf57r2w.png"
        className={styles.pItchprojetoandreza1}
      />
      <div className={styles.frame1}>
        <p className={styles.nomeCompleto}>Nome completo</p>
        <div className={styles.caixaEmail} />
        <p className={styles.email}>Email</p>
        <div className={styles.caixaEmail} />
        <p className={styles.email}>Senha</p>
        <div className={styles.caixaEmail} />
        <p className={styles.repitaSuaSenha}>Repita sua senha</p>
        <div className={styles.caixaEmail} />
        <div className={styles.button2}>
          <p className={styles.button}>Cadastrar</p>
        </div>
        <p className={styles.title}>Conheça nosso plano premium !</p>
      </div>
    </div>
  );
}

export default Component;
