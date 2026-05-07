import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.login}>
      <img
        src="../image/mow16cvf-h8ooki9.png"
        className={styles.pItchprojetoandreza1}
      />
      <div className={styles.formLogIn}>
        <div className={styles.inputField}>
          <p className={styles.label}>Email</p>
          <div className={styles.input}>
            <p className={styles.value}>Insira um email válido</p>
          </div>
        </div>
        <div className={styles.inputField}>
          <p className={styles.label}>Senha</p>
          <div className={styles.input}>
            <p className={styles.value}>Insira sua senha</p>
          </div>
        </div>
        <div className={styles.button2}>
          <p className={styles.button}>Entrar</p>
        </div>
        <p className={styles.textLink}>Esqueceu sua senha?</p>
      </div>
    </div>
  );
}

export default Component;
