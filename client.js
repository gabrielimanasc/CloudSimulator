const net = require("net");
const JsonSocket = require("json-socket");
const readline = require("readline");

const rl = readline.createInterface({//leitor de terminal nativo pra ler dados 
  input: process.stdin,
  output: process.stdout,
});

const operations = require("./operations");

const client = new JsonSocket(new net.Socket());

// Configurações do cliente
const HOST = "127.0.0.1";
const PORT = 5000;

// Conectar ao servidor
client.connect(PORT, HOST, () => {
  console.log("Conectado ao servidor.");

  // Lidar com os dados recebidos do servidor
  client.on("message", (data) => {
    if (data.message) {
      console.log(data.message);
    }
  });

  rl.question("Informe seu nome: ", function (username) {
    rl.question("Informe sua senha: ", function (password) {
      client.sendMessage({
        operation: operations.LOGIN,
        data: { username, password },
      });

      client.sendMessage({
        operation: operations.NEW_ALOC,
        data: { username, alocationSize: 100 },
      });

      client.sendMessage({
        operation: operations.NEW_ALOC,
        data: { username, alocationSize: 500 },
      });

      client.sendMessage({
        operation: operations.NEW_ALOC,
        data: { username, alocationSize: 900 },
      });

      client.sendMessage({
        operation: operations.ALOC_LIST,
        data: { username },
      });

      rl.question("Id da alocação que deseja remover: ", function (alocationId) {
        client.sendMessage({
          operation: operations.REMOVE_ALOC,
          data: { alocationId: Number(alocationId) },
        });

        client.sendMessage({
          operation: operations.ALOC_LIST,
          data: { username },
        });

        /*client.sendMessage({
          operation: operations.TOTAL_PRICE,
          data: { username },
        });*/

        client.sendMessage({
          operation: operations.LOGOUT,
          data: { username },
        });

        client.sendMessage({
          operation: operations.EXIT,
        });
      });
    });
  });

  //   const removeAlocId = readlineSync.question("Id da alocação: ");
});

// Lidar com o evento de fechamento da conexão
client.on("close", () => {
  console.log("Conexão fechada.");
});

// const showMenu = () => {
//   if (isAuthenticaded) {
//     index = readlineSync.keyInSelect(
//       [
//         "LOGOUT",
//         "NEW ALOCATION",
//         "REMOVE ALOCATION",
//         "SHOW ALOCATIONS",
//         "EXIT",
//       ],
//       "Which option?"
//     );

//     if (index === 1) {
//       client.sendMessage({
//         operation: operations.LOGOUT,
//         data: { username: userName },
//       });
//     }

//     if (index === 0 || index === 5) {
//       client.end();
//       process.exit();
//     }

//     showMenu();
//   } else {

//     showMenu();
//   }
// };

// showMenu();
