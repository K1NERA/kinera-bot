const { ApiPromise, WsProvider } = require("@polkadot/api");
const { config } = require("dotenv");
const { default: axios } = require("axios");

// Load environment variables
config();
const url = "http://localhost:8000/api/constellations";
const wsProvider = new WsProvider("wss://node.kinera.network");

async function subscribeToEvents() {
  const api = await ApiPromise.create({ provider: wsProvider });

  api.query.system.events(async (events) => {
    for (const record of events) {
      const { event } = record;
      //  console.log("event", event);
      if (
        event.section === "festivalModule" &&
        event.method === "FestivalCreated"
      ) {
        const [festivalId] = event.data;

        let number = event.toHuman();

        const festivalIdNumber = number.data[1];
        console.log("asa", festivalIdNumber);
        try {
          const festivalDetails = await api.query.festivalModule.festivals(
            festivalIdNumber
          );

          if (festivalDetails.isSome) {
            let details = festivalDetails.toHuman();

            // console.log("details", details);
            const payload = {
              name: details.name,
              description: details.description,
              owner: details.owner,
              constellation_id: details.id,
              status: details.status,
              categoriesAndTags:
                details.categoriesAndTags &&
                details.categoriesAndTags.length > 0
                  ? formatToString(details.categoriesAndTags[0])
                  : "",
              blockStartEnd: formatToString(details.blockStartEnd),
              winners:
                details.winners && details.winners.length > 0
                  ? formatToString(details.winners)
                  : "",
              externalMovies:
                details.externalMovies && details.externalMovies.length > 0
                  ? formatToString(details.externalMovies)
                  : "",
              internalMovies:
                details.internalMovies && details.internalMovies.length > 0
                  ? formatToString(details.internalMovies)
                  : "",
              votePowerDecreaseBlock: details.votePowerDecreaseBlock
            };

            console.log("dale", payload);

            axios
              .post(url, payload)
              .then((response) => {
                // console.log("Response:", response.data);
              })
              .catch((error) => {
                console.error("Error:", error);
              });
          }
        } catch (error) {
          console.error("Error fetching festival details:", error);
        }
      }
    }
  });
}

function hexToString(hex) {
  if (!hex) return "";

  // Remove the '0x' prefix if it exists
  hex = hex.startsWith("0x") ? hex.slice(2) : hex;

  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const part = hex.substr(i, 2);
    str += String.fromCharCode(parseInt(part, 16));
  }

  return str;
}

function formatToString(categories) {
  let formatted = categories.join(",");
  return formatted;
}

subscribeToEvents();
