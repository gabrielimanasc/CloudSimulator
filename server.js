const net = require("net");
const JsonSocket = require("json-socket"); // O Socket original não é feito pra enviar JSON e sim STRING, por isso é utilizado essa lib, pois ela envia JSON com a certeza do envio.
const users = require("./users.json");
const operations = require("./operations");

const logedUsers = [];
const alocations = [];
const unit = [
  { id: 1, capacity: 1000, on: false, alocated: false }, { id: 2, capacity: 1000, on: false, alocated: false },
  { id: 3, capacity: 1000, on: false, alocated: false }, { id: 4, capacity: 1000, on: false, alocated: false },
  { id: 5, capacity: 1000, on: false, alocated: false }, { id: 6, capacity: 1000, on: false, alocated: false },
  { id: 7, capacity: 1000, on: false, alocated: false }, { id: 8, capacity: 1000, on: false, alocated: false },
  { id: 9, capacity: 1000, on: false, alocated: false }, { id: 10, capacity: 1000, on: false, alocated: false },
  { id: 11, capacity: 1000, on: false, alocated: false }, { id: 12, capacity: 1000, on: false, alocated: false }
]

const maxAlocSize = 1000;

const alocPrice = 0.1;
const usagePrice = 0.05;
const initialPrice = 0.5;

function updateUnitById(id, newCapacity, newOn, newAlocated) {
  const index = unit.findIndex(item => item.id === id);

  if (index !== -1) {
    // Atualiza os valores da unidade com o id correspondente
    unit[index].capacity = newCapacity;
    unit[index].on = newOn;
    unit[index].alocated = newAlocated;

    console.log(`Unidade com id ${id} atualizada com sucesso.`);
  } else {
    console.log(`Unidade com id ${id} não encontrada.`);
  }
}

function getCapacityById(id) {
  const unitItem = unit.find(item => item.id === id);

  if (unitItem) {
    return unitItem.capacity;
  } else {
    console.log(`Unidade com id ${id} não encontrada.`);
    return null; // ou outro valor padrão, dependendo do seu caso
  }
}


const server = net.createServer((socket) => {
  socket = new JsonSocket(socket);

  // Lidar com os dados recebidos do cliente
  socket.on("message", (message) => {
    console.log({ message });

    const { operation, data } = message;

    switch (operation) {
      case operations.LOGIN: {
        const { username, password } = data;
        const user = users.find((user) => user.username === username);

        if (user) {
          if (user.password === password) {
            socket.sendMessage({
              message: `Login efetuado com sucesso!`,
              isAuthenticaded: true,
            });
            logedUsers.push(user);
          } else {
            socket.sendMessage({
              message: `Senha incorreta!`,
              isAuthenticaded: false,
            });
          }
        } else {
          socket.sendMessage({
            message: `Usuário não encontrado!`,
            isAuthenticaded: false,
          });
        }

        break;
      }

      case operations.LOGOUT: {
        const { username } = data;

        const userIndex = logedUsers.findIndex(
          (user) => user.username === username
        );

        if (userIndex !== -1) {
          logedUsers.splice(userIndex, 1);
          socket.sendMessage({
            message: `Logout efetuado com sucesso!`,
            isAuthenticaded: false,
          });
        } else {
          socket.sendMessage({
            message: `Usuário não encontrado!`,
            isAuthenticaded: false,
            error: true,
          });
        }

        break;
      }

      case operations.NEW_ALOC: {
        const { username, alocationSize } = data;

        const user = logedUsers.find((user) => user.username === username);

        if (!user) {
          socket.sendMessage({
            message: `Usuário não encontrado!`,
            error: true,
          });
          break;
        }

        if (alocationSize > maxAlocSize) {
          socket.sendMessage({
            message: `Tamanho de alocação muito grande, máximo ${maxAlocSize}!`,
            error: true,
          });
          break;
        }

        let allocated = false;
        let allocatedUnit = null;

        // Teste de firstFit
        for (const unitItem of unit) {
          if (unitItem.capacity >= alocationSize) {
            // Atualiza os valores da unidade alocada
            unitItem.on = true;
            unitItem.alocated = true;
            unitItem.capacity -= alocationSize;

            // Cria uma nova alocação
            const newAloc = {
              username,
              id: parseInt(Math.random() * 1000),
              size: alocationSize,
              createdAt: new Date(),
              alocatedAt: unitItem.id
            };

            // Adiciona a nova alocação à lista
            alocations.push(newAloc);

            // Atualiza as variáveis indicando que a alocação foi realizada
            allocated = true;
            allocatedUnit = unitItem;

            break;
          }
        }

        if (allocated) {
          socket.sendMessage({
            message: `Alocação bem-sucedida na unidade ${allocatedUnit.id}, capacidade restante: ${allocatedUnit.capacity}`,
          });
        } else {
          socket.sendMessage({
            message: `Não foi possível alocar o espaço necessário.`,
            error: true,
          });
        }

        break;
      }

      case operations.REMOVE_ALOC: {
        const { alocationId } = data; // recebe por parametro o id que deve ser removido

        const alocIndex = alocations.findIndex(
          (alocation) => alocation.id === alocationId // busca o id que deve ser removido
        );

        if (alocIndex !== -1) {
          const alocation = alocations[alocIndex];
          const idUnit = alocation.alocatedAt;
          const currentCapacity = getCapacityById(idUnit);

          alocations.splice(alocIndex, 1);

          const now = new Date();
          const usageTime = now - alocation.createdAt;

          const totalPrice =
            initialPrice + alocPrice * alocation.size + usagePrice * usageTime; //conta para saber qual o total gasto

          socket.sendMessage({
            message: `Alocação removida com sucesso!, valor: ${totalPrice.toFixed(
              2
            )}`,
          });
          updateUnitById(alocation.alocatedAt, currentCapacity + alocation.size, false, false);

          socket.sendMessage({
            message: `Alocação de id ${alocation.alocatedAt} tem ${currentCapacity + alocation.size} de capacidade após a deslocação`,
          });

        } else {
          socket.sendMessage({ message: `Alocação não encontrada!` });
        }

        break;
      }

      case operations.ALOC_LIST: {
        const alocationsString = alocations
          .filter((alocation) => alocation.username === data.username)
          .map((alocation) => {
            return `id: ${alocation.id}, username: ${alocation.username}, size: ${alocation.size}, createdAt: ${alocation.createdAt}`;
          });
        socket.sendMessage({ message: alocationsString });

        break;
      }

      case operations.EXIT:
        // Lidar com o evento de fechamento da conexão
        socket.on("close", () => {
          console.log("Cliente desconectado.");
        });
        break;
    }
  });
});

// Escutar em uma porta específica
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Servidor está ouvindo na porta ${PORT}`);
});
