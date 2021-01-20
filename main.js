
let territories;

let checkboxes = {};
let TerritoryUpgrades = {};
let upkeep = {};
let correctprod = [];
let correctupg = [];
let available = {};
let selected = [];

let baseStats =
{
    mindamage: 300,
    maxdamage: 600,
    attack: 0.5,
    health: 150000,
    defence: 10,
    emeralds: 3000,
    materials: 500
};

function copysim() {
    let json = {};
    json.territories = territories;
    json.TerritoryUpgrades = TerritoryUpgrades;
    json.upkeep = upkeep;
    json.available = available;
    json.selected = selected;
    json.baseStats = baseStats;
    json.res = res;
    json.ems = ems;
    json.newTerritories = newTerritories;
    json.upgrades = upgrades;
    json.costs = costs;
    updateClipboard(btoa(JSON.stringify(json)));
}

function updateClipboard(newClip) {
    navigator.clipboard.writeText(newClip).then(function () {
        /* clipboard successfully set */
    }, function () {
        /* clipboard write failed */
    });
}

async function loadFromClipboard() {
    let content = await navigator.clipboard.readText();
    console.log(`Clipboard data loaded: `, content);
    if (!isBase64(content)) {
        window.alert("Incorrect territory data, parsing failed.");
        return;
    }
    territories = atob(content).split(",").map(x => x.trim());
    for (const x of territories) {
        if (!newTerritories.hasOwnProperty(x)) {
            console.log(`${x} cannot be found in territory list. Skipping!`);
            territories = territories.filter(y => y !== x);
        }
    }
    updateTerritoryList();
    updateUpgrades();
}

function updateTerritoryList() {
    let div = document.getElementById("territories");
    checkboxes = {};
    available = {};
    div.innerHTML = '';
    for (const name of territories) {
        var x = document.createElement("INPUT");
        x.setAttribute("type", "checkbox");
        x.setAttribute("onchange", "updateSelected();updateUpgrades()");
        x.value = name;
        x.id = name;
        div.appendChild(x);
        checkboxes[name] = x;
        var label = document.createElement("label");
        label.htmlFor = name;
        label.innerHTML = name;
        div.appendChild(label);
        div.appendChild(document.createElement("br"));
        TerritoryUpgrades[name] = {};
        for (const types in upgrades) {
            for (const upgrade in upgrades[types]) {
                TerritoryUpgrades[name][upgrade] = 0;
            }
        }
        available[name] = {};
        available[name].Resources = { amount: 3600, cost: 0, eff: 3600 };
        available[name].Emeralds = { amount: 9000, costOre: 0, costCrops: 0, eff: 9000 };
    }
}

function selall() {
    let val = {};
    let c = false;
    for (const terr in TerritoryUpgrades) {
        for (const upgrade in TerritoryUpgrades[terr]) {
            if (!val[upgrade])
                val[upgrade] = TerritoryUpgrades[terr][upgrade];
            else if (val[upgrade] !== TerritoryUpgrades[terr][upgrade]) {
                c = confirm("One or more territories have custom settings. Selecting all will make every territory have the same setting. Are you sure you want to continue?");
                if (!c)
                    return;
                break;
            }
        }
        if (c)
            break;
    }
    for (const x in checkboxes) {
        checkboxes[x].checked = true;
    }
    updateSelected();
    updateUpgrades();
}

function unsellall() {
    for (const x in checkboxes) {
        checkboxes[x].checked = false;
    }
    updateSelected();
    updateUpgrades();
}

function updateSelected() {
    selected = [];
    for (const x of territories) {
        if (document.getElementById(x).checked)
            selected.push(x);
    }
}

function updateUpgrades() {
    let gt = document.getElementById("guildtower");
    let s = document.getElementById("storage");
    let b = document.getElementById("bonuses");

    for (const x of territories) {
        if (!selected.includes(x))
            continue;
        for (const types in upgrades) {
            for (const upgrade in upgrades[types]) {
                try {
                    TerritoryUpgrades[x][upgrade] = parseInt(document.getElementById(upgrade + "range").value);
                } catch (error) {

                }
                finally {
                    if (!TerritoryUpgrades[x][upgrade])
                        TerritoryUpgrades[x][upgrade] = 0;
                }
            }
        }
    }
    calcUpkeep();
    updateStats();

    gt.innerHTML = '';
    s.innerHTML = '';
    b.innerHTML = '';


    for (const x in upgrades["Guild Tower"]) {
        let range = document.createElement("input");
        range.setAttribute("type", "range");
        range.setAttribute("onchange", "updateUpgrades()");
        if (selected.length > 0)
            range.value = TerritoryUpgrades[selected[0]][x];
        else
            range.value = 0;
        range.max = upgrades["Guild Tower"][x].MaxLevel;
        range.min = 0;
        range.step = 1;
        range.id = x + "range";
        var label = document.createElement("label");
        label.htmlFor = x + "name";
        label.innerHTML = `${x}: Level ${range.value}`;
        gt.appendChild(range);
        gt.appendChild(label);
        gt.appendChild(document.createElement("br"));
    }

    for (const x in upgrades["Storage"]) {
        let range = document.createElement("input");
        range.setAttribute("type", "range");
        range.setAttribute("onchange", "updateUpgrades()");
        if (selected.length > 0)
            range.value = TerritoryUpgrades[selected[0]][x];
        else
            range.value = 0;
        range.max = upgrades["Storage"][x].MaxLevel;
        range.min = 0;
        range.step = 1;
        range.id = x + "range";
        var label = document.createElement("label");
        label.htmlFor = x + "name";
        label.innerHTML = `${x}: Level ${range.value}`;
        s.appendChild(range);
        s.appendChild(label);
        s.appendChild(document.createElement("br"));
    }

    for (const x in upgrades["Bonus"]) {
        let range = document.createElement("input");
        range.setAttribute("type", "range");
        range.setAttribute("onchange", "updateUpgrades()");
        if (selected.length > 0)
            range.value = TerritoryUpgrades[selected[0]][x];
        else
            range.value = 0;
        range.max = upgrades["Bonus"][x].MaxLevel;
        range.min = 0;
        range.step = 1;
        range.id = x + "range";
        var label = document.createElement("label");
        label.htmlFor = x + "name";
        label.innerHTML = `${x}: Level ${range.value}`;
        b.appendChild(range);
        b.appendChild(label);
        b.appendChild(document.createElement("br"));
    }
}

function updateStats() {
    let damage = document.getElementById("damage");
    let attack = document.getElementById("attack");
    let health = document.getElementById("health");
    let defence = document.getElementById("defence");
    let statter = document.getElementById("statterr");
    let close = document.getElementById("close");

    let storage = document.getElementById("statstorage");

    let bonus = document.getElementById("statbonus");

    let Emeralds = document.getElementById("Emeralds");
    let Ore = document.getElementById("Ore");
    let Wood = document.getElementById("Wood");
    let Crops = document.getElementById("Crops");
    let Fish = document.getElementById("Fish");

    Emeralds.innerHTML = upkeep.Emeralds;
    Ore.innerHTML = upkeep.Ore;
    Wood.innerHTML = upkeep.Wood;
    Crops.innerHTML = upkeep.Crops;
    Fish.innerHTML = upkeep.Fish;


    if (selected.length == 0) {
        damage.innerHTML = '-';
        attack.innerHTML = '-';
        health.innerHTML = '-';
        defence.innerHTML = '-';
        statter.innerHTML = ``;
        close.innerHTML = ``;
    }
    else {
        let upgrade = TerritoryUpgrades[selected[0]];

        let bonusFromClose = territories.filter(x => newTerritories[selected[0]].Routes.includes(x)).length * 0.3;
        bonusFromClose += 1;

        close.innerHTML = `${parseInt(parseInt((bonusFromClose - 1) / 0.3))} close territories`;
        statter.innerHTML = selected[0];


        if (upgrade.Damage == 0)
            damage.innerHTML = `${parseInt(baseStats.mindamage)} - ${parseInt(baseStats.maxdamage)}`;
        else
            damage.innerHTML = `${parseInt(bonusFromClose * (baseStats.mindamage + baseStats.mindamage * upgrades["Guild Tower"]["Damage"].Increase[upgrade.Damage - 1] / 100))} - ${parseInt(bonusFromClose * (baseStats.maxdamage + baseStats.maxdamage * upgrades["Guild Tower"]["Damage"].Increase[upgrade.Damage - 1] / 100))} (${parseInt(upgrades["Guild Tower"]["Damage"].Increase[upgrade.Damage - 1])} + ${parseInt(parseInt((bonusFromClose - 1) * 100))}% bonus)`;

        if (upgrade.Attack == 0)
            attack.innerHTML = `${baseStats.attack} attacks per second`;
        else
            attack.innerHTML = `${(baseStats.attack + baseStats.attack * upgrades["Guild Tower"]["Attack"].Increase[upgrade.Attack - 1] / 100).toFixed(2)} attacks per second (${parseInt(upgrades["Guild Tower"]["Attack"].Increase[upgrade.Attack - 1])}% bonus)`;

        if (upgrade.Health == 0)
            health.innerHTML = `${baseStats.health} health`;
        else
            health.innerHTML = `${parseInt(bonusFromClose * (baseStats.health + baseStats.health * upgrades["Guild Tower"]["Health"].Increase[upgrade.Health - 1] / 100))} health (${parseInt(upgrades["Guild Tower"]["Health"].Increase[upgrade.Health - 1])} + ${parseInt(parseInt((bonusFromClose - 1) * 100))}% bonus)`;

        if (upgrade.Defence == 0)
            defence.innerHTML = `${parseInt(baseStats.defence)}%  defence`;
        else
            defence.innerHTML = `${parseInt(baseStats.defence + baseStats.defence * upgrades["Guild Tower"]["Defence"].Increase[upgrade.Defence - 1] / 100)}% defence (${parseInt(upgrades["Guild Tower"]["Defence"].Increase[upgrade.Defence - 1])}% bonus)`;

        storage.innerHTML = '';
        let stor = {
            Emeralds: 0,
            Crops: 0,
            Fish: 0,
            Wood: 0,
            Ore: 0,
        };
        for (const terr of selected) {
            for (const x of newTerritories[terr].Storage) {
                if (x === "Emeralds") {
                    if (upgrade["Larger Emerald Storage"] == 0)
                        stor[x] += baseStats.emeralds;
                    else
                        stor[x] += parseInt(baseStats.emeralds + baseStats.emeralds * upgrades["Storage"]["Larger Emerald Storage"].Increase[upgrade["Larger Emerald Storage"] - 1] / 100);
                }
                else {
                    if (upgrade["Larger Resource Storage"] == 0)
                        stor[x] += baseStats.materials;
                    else
                        stor[x] += parseInt(baseStats.materials + baseStats.materials * upgrades["Storage"]["Larger Resource Storage"].Increase[upgrade["Larger Resource Storage"] - 1] / 100);
                }
            }
        }

        for (const x in stor) {
            let div = document.createElement("h3");
            div.innerHTML = `${x}: ${stor[x]}`;
            storage.appendChild(div);
        }


        bonus.innerHTML = '';

        for (const x in upgrades.Bonus) {
            let div = document.createElement("h3");
            if (x === "Tower Multi-Attacks") {
                if (upgrade[x] > 0)
                    div.innerHTML = `${x}: ${parseInt(upgrades["Bonus"][x].Increase[upgrade[x] - 1])} ${upgrades["Bonus"][x].IncreaseType} `;
            }
            else {
                if (upgrade[x] > 0)
                    div.innerHTML = `${x}: +${parseInt(upgrades["Bonus"][x].Increase[upgrade[x] - 1])} ${upgrades["Bonus"][x].IncreaseType} `;
            }
            bonus.appendChild(div);
        }
    }
}

function calcUpkeep() {
    upkeep = {};
    for (const terr in TerritoryUpgrades) {
        for (const upg in TerritoryUpgrades[terr]) {
            if (!upkeep.hasOwnProperty(costs[upg].CostType))
                upkeep[costs[upg].CostType] = 0;
            if (TerritoryUpgrades[terr][upg] > 0)
                upkeep[costs[upg].CostType] += costs[upg].Cost[TerritoryUpgrades[terr][upg] - 1];
        }
    }
    calcProd();
}

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

let found = 0;

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
        //correctprod.push(prod);
        //correctupg.push(upgradelist);
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
            // let unique = new Set();
            // for (const y of upgradelist[x]) {
            //     unique.add(y);
            // }
        }


    }
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


function isBase64(str) {
    try {
        return btoa(atob(str)) == str;
    } catch (err) {
        return false;
    }
}

function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
}