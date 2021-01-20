const fs = require("fs");
const atob = require('atob');

let base64 = fs.readFileSync("copy.txt", "utf-8");

let data = JSON.parse(atob(base64));
let found = 0;
let correctprod = [];
let correctupg = [];

for (const x in data) {
    global[x] = data[x];
}

console.log(process.memoryUsage());

run();

function calcProd() {
    let prod = {};
    prod.Emeralds = 0;
    prod.Crops = 0;
    prod.Wood = 0;
    prod.Ore = 0;
    prod.Fish = 0;

    for (const terr in available) {
        for (const x of newTerritories[terr].Resources) {
            prod[x] += available[terr].Resources.amount;
            upkeep.Emeralds += available[terr].Resources.cost;
        }
        prod.Emeralds += available[terr].Emeralds.amount;
        upkeep.Crops += available[terr].Emeralds.costCrops;
        upkeep.Ore += available[terr].Emeralds.costOre;
    }
    return prod;
}

function McalcUpkeep() {
    let upk = {};
    for (const terr in TerritoryUpgrades) {
        for (const upg in TerritoryUpgrades[terr]) {
            if (!upk.hasOwnProperty(costs[upg].CostType))
                upk[costs[upg].CostType] = 0;
            if (TerritoryUpgrades[terr][upg] > 0)
                upk[costs[upg].CostType] += costs[upg].Cost[TerritoryUpgrades[terr][upg] - 1];
        }
    }
    return McalcProd(upk);
}

function McalcProd(upk) {
    let prod = {};
    prod = {};
    prod.Emeralds = 0;
    prod.Crops = 0;
    prod.Wood = 0;
    prod.Ore = 0;
    prod.Fish = 0;

    for (const terr in available) {
        for (const x of newTerritories[terr].Resources) {
            prod[x] += available[terr].Resources.amount;
            upk.Emeralds += available[terr].Resources.cost;
        }
        prod.Emeralds += available[terr].Emeralds.amount;
        upk.Crops += available[terr].Emeralds.costCrops;
        upk.Ore += available[terr].Emeralds.costOre;
    }
    return upk;
}


async function simRec(prod, upk, upgradelist) {
    let correct = true;
    for (const x in prod) {
        if (upkeep[x] > prod[x]) {
            correct = false;
            break;
        }
    }
    if (correct) {
        console.log("Found a correct entry, currently: ", ++found);
        correctprod.push(prod);
        correctupg.push(upgradelist);
        // if (upgradelist.Emeralds.length > selected.length)
        //     debugger;
    }

    for (const x in prod) {
        let count = 0;
        if (x === "Emeralds") {
            for (const terr of selected) {
                if (newTerritories[terr].Emeralds)
                    ++count;
            }
        }
        else {
            for (const terr of selected) {
                if (newTerritories[terr].Resources.includes(x))
                    ++count;
            }
        }
        //console.log(upgradelist[x].length);
        if (upgradelist[x].length < count) {
            for (const resup of res) {
                let nprod = cpy(prod);
                //console.log(nprod === prod);
                nprod[x] += resup[0];
                let nupk = cpy(upk);
                //console.log(nupk === upk);
                nupk[x] += resup[1];
                let nupgradelist = cpy(upgradelist);
                //console.log(nupgradelist === upgradelist);
                nupgradelist[x].push(resup[2]);
                //console.log("Call, new, " + x);
                await simRec(nprod, nupk, nupgradelist);
                //console.log("End, new, " + x);
            }
        }
        else {

        }


    }
    //console.log("return");
}

async function simulate() {
    correctprod = [];
    correctupg = [];
    let upgradelist = {};
    upgradelist.Emeralds = [];
    upgradelist.Crops = [];
    upgradelist.Wood = [];
    upgradelist.Ore = [];
    upgradelist.Fish = [];
    let prod = calcProd();
    let upk = McalcUpkeep();
    await simRec(prod, upk, upgradelist);
    console.log("Finished simulation");
}

function cpy(obj) {
    let newo = {};
    for (const x in obj) {
        if (Array.isArray(obj[x]))
            newo[x] = [...obj[x]];
        else if (isNumber(obj[x]))
            newo[x] = obj[x];
        else
            newo[x] = Object.assign({}, obj[x]);
    }
    return newo;
}

async function run() {
    let date = new Date();
    console.log("Started simulation");
    await simulate();
    console.log("Finished simulation, elapsed minutes: " + (new Date() - date) / 1000 / 60);
}

function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
}