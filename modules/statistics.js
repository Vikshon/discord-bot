function Get_Statistics(client)
{
    try {
        console.log(client);
        // const GUILDS = client.guilds.cache.map(p => console.log(p));
        // console.log(GUILDS);
    }
    catch (err) {
        console.log(err);
    }
}

module.exports = Get_Statistics;