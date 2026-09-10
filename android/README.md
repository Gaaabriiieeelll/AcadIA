# AcadIA para Android

Aplicativo mínimo que fornece o widget **AcadIA · Em aberto** para a tela inicial.
Ele não replica toda a interface web: faz o pareamento seguro com o AcadIA, mantém
um cache criptografado dos compromissos sem data final e abre o calendário web ao
tocar em um item.

## Requisitos

- Android Studio com JDK 17 e Android SDK 37;
- servidor AcadIA publicado em HTTPS;
- migrações do Prisma aplicadas no servidor.

## Gerar o APK de desenvolvimento

No diretório `android`, execute:

```powershell
.\gradlew.bat assembleDebug -PACADIA_BASE_URL=https://seu-acadia.example
```

O APK será criado em `app/build/outputs/apk/debug/app-debug.apk`. O workflow
`.github/workflows/android-widget.yml` também gera esse arquivo como artefato;
configure a variável de repositório `ACADIA_BASE_URL` com a URL HTTPS publicada.

## Conectar o celular

1. Instale o APK e abra o aplicativo AcadIA uma vez.
2. No AcadIA web, abra **Calendário** e localize **Widget de compromissos em aberto**.
3. Informe um nome para o aparelho e gere o código temporário.
4. No próprio Android, toque em **Abrir no app Android**. Também é possível copiar
   o endereço do servidor e o código manualmente para o aplicativo.
5. Pressione a tela inicial, escolha **Widgets** e adicione **AcadIA · Em aberto**.

O código expira em dez minutos e só pode ser usado uma vez. O aparelho gera o
próprio token aleatório; o servidor guarda somente seu hash e o Android protege o
token e o cache com uma chave do Android Keystore. A conexão pode ser revogada no
calendário web.

Builds `debug` aceitam HTTP para testes na rede local. Builds de produção aceitam
somente HTTPS.
