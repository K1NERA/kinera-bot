const { ApiPromise, WsProvider } = require("@polkadot/api");
const { config } = require("dotenv");
const { default: axios } = require("axios");

// Load environment variables
config();

async function subscribeToEvents() {
  const url = "https://api.kinera.network/api/constellations";
  const wsProvider = new WsProvider("wss://node.kinera.network");
  const api = await ApiPromise.create({ provider: wsProvider });

  api.query.system.events(async (events) => {
    for (const record of events) {
      const { event } = record;
      if (
        event.section === "festivalModule" &&
        event.method === "FestivalCreated"
      ) {
        const [festivalId] = event.data;

        let number = event.toHuman();

        const festivalIdNumber = number.data[1];
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

            //    console.log("dale", payload);

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

async function subscribeToCommunityEvents() {
  const url = "https://api.kinera.network/api/community/";
  const wsProvider = new WsProvider("wss://node.kinera.network");
  const api = await ApiPromise.create({ provider: wsProvider });

  api.query.system.events(async (events) => {
    for (const record of events) {
      const { event } = record;
      //console.log('event',event)
      // Filtrar evento de criação de comunidade e conclusão de votação
      if (
        event.section === "communitiesModule" &&
        event.method === "VotingConcluded"
      ) {
        const [communityId] = event.data;

        // Obter o número humano da comunidade
        let communityDetails = await api.query.communitiesModule.communities(
          communityId
        );

        try {
          if (communityDetails.isSome) {
            let details = communityDetails.toHuman();
            const communityType = Object.keys(details.communityType)[0]; // e.g., "Private"
            const monthlyFee =
              details.communityType[communityType].monthlyFee || 0;

            if (details.voteResult === "Approve") {
              const payload = {
                name: details.name,
                type: Object.keys(details.communityType)[0],
                user_address: details.createdBy,
                community_id: details.id,
                monthly_fee: monthlyFee
              };

              axios
                .post(url, payload)
                .then((response) => {
                  console.log("Community sent successfully:", response.data);
                })
                .catch((error) => {
                  console.error("Error sending community data:", error);
                });
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
  });
}

async function eventApproveMember() {
  const url = "https://api.kinera.network/api/community/";
  const wsProvider = new WsProvider("wss://node.kinera.network");
  const api = await ApiPromise.create({ provider: wsProvider });

  api.query.system.events(async (events) => {
    for (const record of events) {
      const { event } = record;
      //console.log('event',event)
      // Filtrar evento de criação de comunidade e conclusão de votação
      if (
        event.section === "communitiesModule" &&
        event.method === "MemberAdded"
      ) {
        const [user] = event.data;
        console.log(' event.data',  event.toHuman())
        let data = event.toHuman();

        console.log(' event.data',  data.data[0])
        console.log(' event.data',  data.data[1])

        if(data && data.data && data.data[0]) {
          let communityDetails = await api.query.communitiesModule.communities(
            data.data[1]
          );
  
          try {
            if (communityDetails.isSome) {
              let details = communityDetails.toHuman();
              const communityType = Object.keys(details.communityType)[0]; // e.g., "Private"
              const monthlyFee =
                details.communityType[communityType].monthlyFee || 0;
  
              if (details.voteResult === "Approve") {
                const payload = {
                  name: details.name,
                  type: Object.keys(details.communityType)[0],
                  user_address:  data.data[0],
                  community_id: data.data[1],
                  monthly_fee: monthlyFee
                };
  
                axios
                  .post(url, payload)
                  .then((response) => {
                    console.log("Community sent successfully:", response.data);
                  })
                  .catch((error) => {
                    console.error("Error sending community data:", error);
                  });
              }
            }
          } catch (err) {
            console.log(err);
          }
        }
      }
    }
  });
}

function formatToString(categories) {
  let formatted = categories.join(",");
  return formatted;
}
eventApproveMember()
subscribeToEvents();
subscribeToCommunityEvents();
