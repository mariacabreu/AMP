import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.esqueciMinhaSenha}>
      <img
        src="../image/mow16cvs-4jz7ffc.png"
        className={styles.pItchprojetoandreza1}
      />
      <div className={styles.formForgotPassword}>
        <div className={styles.inputField}>
          <p className={styles.label}>Email</p>
          <div className={styles.input}>
            <p className={styles.value}>Insira o email cadastrado</p>
          </div>
        </div>
        <div className={styles.buttonGroup}>
          <div className={styles.button2}>
            <p className={styles.button}>Cancel</p>
          </div>
          <div className={styles.button4}>
            <p className={styles.button3}>Nova Senha</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Component;
