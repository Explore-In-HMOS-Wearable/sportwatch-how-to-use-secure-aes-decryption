import huks from '@ohos.security.huks';

export default {
    data: {
        decryptedText: '',
        error: false,
        errorMessage: ''
    },
    onInit() {
        const encryptedData = new Uint8Array([18, 27, 146, 85, 10, 42, 47, 216, 60, 107, 89, 157]);
        const dummyKey = new Uint8Array(16).fill(0xAA);
        const iv = new Uint8Array(16).fill(0x55);

        console.info(`encryptedData ${encryptedData}`);
        console.info(`key ${dummyKey}`);
        console.info(`iv ${iv}`);
        const decrypredData = this.aesCtrDecode('keyalias', dummyKey, encryptedData, iv)

        console.info(`decrypted text: ${this.byteArrayToString(decrypredData)}`);
        this.decryptedText = this.byteArrayToString(decrypredData)
    },

    aesCtrDecode(keyAlias, key, encryptedData, iv) {
        let properties = new Array();
        properties[0] = {
            tag: huks.HuksTag.HUKS_TAG_ALGORITHM,
            value: huks.HuksKeyAlg.HUKS_ALG_AES
        }

        properties[1] = {
            tag: huks.HuksTag.HUKS_TAG_PURPOSE,
            value: huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_DECRYPT
        }


        properties[2] = {
            tag: huks.HuksTag.HUKS_TAG_KEY_SIZE,
            value: huks.HuksKeySize.HUKS_AES_KEY_SIZE_128
        }

        properties[3] = {
            tag: huks.HuksTag.HUKS_TAG_PADDING,
            value: huks.HuksKeyPadding.HUKS_PADDING_NONE
        }

        properties[4] = {
            tag: huks.HuksTag.HUKS_TAG_BLOCK_MODE,
            value: huks.HuksCipherMode.HUKS_MODE_CTR
        }

        let importOptions = {
            properties: properties,
            inData: key
        }

        let decryptedData;

        huks.importKeyItem(keyAlias, importOptions, (err, data) => {
            if (err) {
                console.error(`Key import key item error. ${JSON.stringify(err)}`);
                this.errorMessage = JSON.stringify(err)
                this.error = true
                return
            }

            let sessionProperties = [...properties];
            sessionProperties.push({
                tag: huks.HuksTag.HUKS_TAG_IV,
                value: iv
            })

            let initOptions = {
                properties: sessionProperties,
                inData: new Uint8Array(0)
            }

            huks.initSession(keyAlias, initOptions, (initErr, sessionData) => {
                if (initErr) {
                    console.error(`Key init session err ${JSON.stringify(initErr)}`);
                    this.errorMessage = JSON.stringify(initErr)
                    this.error = true
                }

                const handle = sessionData.handle
                let finishOptions = {
                    properties: sessionProperties,
                    inData: encryptedData
                }

                huks.finishSession(handle, finishOptions, (finishErr, finishData) => {
                    if (finishErr) {
                        console.error(`Decrypt err ${finishErr}`);
                        this.errorMessage = JSON.stringify(finishErr)
                        this.error = true
                        return;
                    }

                    if (!finishData) {
                        console.error(`FinishData err ${finishData}`);
                        this.errorMessage = JSON.stringify(finishData)
                        this.error = true
                        return;
                    }
                    this.error = false;
                    decryptedData = finishData.outData;
                })
            })
        })
        console.error(`Decrypred Data Uint8Array: ${decryptedData}`);

        return decryptedData;
    },

    byteArrayToString(byteArray) {
        let string = '';
        for (let i = 0; i < byteArray.length; i++) {
            string = string + String.fromCharCode(byteArray[i])
        }
        return string
    }
}
