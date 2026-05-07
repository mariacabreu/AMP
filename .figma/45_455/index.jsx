import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.inicial}>
      <img
        src="../image/mow16cv7-aerakpu.png"
        className={styles.pItchprojetoandreza1}
      />
      <p className={styles.sejaBemVindoAoSeuApl}>
        Seja-bem vindo ao seu aplicativo de manutenção preventiva
      </p>
      <p className={styles.vocJPossuiUmaConta}>Você já possui uma conta?</p>
      <div className={styles.buttonGroup}>
        <div className={styles.button2}>
          <p className={styles.button}>Criar Conta</p>
        </div>
        <div className={styles.button4}>
          <p className={styles.button3}>Entrar</p>
        </div>
      </div>
    </div>
  );
}

export default Component;
