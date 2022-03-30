function CalculateSingleTable(tablebodyelement, skillname, playerclass, morph, onweaponIAS, offweaponIAS, totalskillIAS, wclass, wsm, EIAScap){
    var tempIAS = 0;
    var lastfpa = -1;
    var currentrow = -1;
    var done = false;
    var highlightdone = false;
    var sequencefactor = (skilldata[skillname]["issequence"]) ? -30 : 0;
    var skillfactor = skilldata[skillname]["skillfactor"];
    
    // find max possible output, so we will know to stop loop when we hit it
    var maxEIAS = ComputeMaxEIAS(totalskillIAS, wsm, sequencefactor, skillfactor, EIAScap);
    var maxFPA = CalculateFPA(skillname, playerclass, morph, wclass, maxEIAS);
    
    // Find the smallest EIAS value that gives the same breakpoint at zero off-weapon IAS.
    var smallesteiassamebp = -85;
    var eiasatzero = ComputeEIAS(totalskillIAS, onweaponIAS, wsm, sequencefactor, skillfactor, EIAScap);
    var currentbp = CalculateFPA(skillname, playerclass, morph, wclass, eiasatzero);
    while (smallesteiassamebp <= eiasatzero){
        var testbp = CalculateFPA(skillname, playerclass, morph, wclass, smallesteiassamebp);
        if (OutputEquals(currentbp, testbp)){
            break;
        }
        smallesteiassamebp++;
    }
    
    
    // fill the table starting from 0 off-weapon gear IAS until we hit the EIAS cap, the max EIAS we can reach with this setup, or the diminishing returns cap on gear IAS
    while (!done){        
        var localtotalgearIAS = onweaponIAS + tempIAS;
        if (DiminishingReturnsLimitReached(localtotalgearIAS)){
            done = true;
        }
        var eias = ComputeEIAS(totalskillIAS, localtotalgearIAS, wsm, sequencefactor, skillfactor, EIAScap);
        if (eias >= EIAScap){
            done = true;
        }
        var fpadata = CalculateFPA(skillname, playerclass, morph, wclass, eias);
        if (OutputEquals(fpadata, maxFPA)){
            done = true;
        }
        if (!OutputEquals(fpadata, lastfpa)){
            var newrow = document.createElement('tr');
            var leftcell = document.createElement('td');
            leftcell.innerHTML = tempIAS;
            newrow.appendChild(leftcell);
            var middlecell = document.createElement('td');
            if (tempIAS == 0){
                middlecell.innerHTML = smallesteiassamebp;
            }
            else {
                middlecell.innerHTML = eias;
            }
            newrow.appendChild(middlecell);
            var midrightcell = document.createElement('td');
            if (skilldata[skillname]["isrollbackskill"]){
                midrightcell.innerHTML = PrettyPrintActionFrameArray(fpadata["actionframes"]);
            }
            else {
                midrightcell.innerHTML = fpadata["actionframes"];
            }
            newrow.appendChild(midrightcell);
            var rightcell = document.createElement('td');
            if (skilldata[skillname]["isrollbackskill"]){
                rightcell.innerHTML = PrettyPrintFPAArray(fpadata["fpa"]);
            }
            else {
                rightcell.innerHTML = fpadata["fpa"];
            }
            newrow.appendChild(rightcell);
            tablebodyelement.appendChild(newrow);
            lastfpa = fpadata;
            currentrow = newrow;
        }
        if ((offweaponIAS == tempIAS) || (done && !highlightdone)){
            currentrow.classList.add("highlightedrow");
            highlightdone = true;
        }
        tempIAS++;
    }
}


function RecalculateTables(){
    if (BlankInputsExist()){
        return;
    }
    if (CorrectNegativeInputs()){
        return;
    }
    
    // collect input
    var playerclass = GetPlayerClass();
    var playermorph = GetPlayerMorph();
    var werewolflevel = GetWerewolfLevel();
    var maullevel = GetMaulLevel();
    var maulcharges = GetMaulCharges();
    var fanaticismlevel = GetFanaticismLevel();
    var burstofspeedlevel = GetBurstOfSpeedLevel();
    var weapon = GetWeapon();
    var onweaponIAS = GetOnWeaponIAS();
    var offweaponIAS = GetOffWeaponIAS();
    
    // derive ias from skill levels
    var werewolfIAS = 0;
    if (werewolflevel > 0){
        werewolfIAS =  Math.min(80, 10 + TruncateToInt(70 * TruncateToInt( (110*werewolflevel) / (werewolflevel+6) ) / 100));
    }
    var maulIAS = 3 * maulcharges;
    var fanaticismIAS = 0;
    if (fanaticismlevel > 0){
        fanaticismIAS = Math.min(40, 10 + TruncateToInt(30 * TruncateToInt( (110*fanaticismlevel) / (fanaticismlevel+6) ) / 100));
    }
    var burstofspeedIAS = 0;
    if (burstofspeedlevel > 0){
        burstofspeedIAS = Math.min(60, 15 + TruncateToInt(45 * TruncateToInt( (110*burstofspeedlevel) / (burstofspeedlevel+6) ) / 100));
    }
    var totalskillIAS = werewolfIAS + maulIAS + fanaticismIAS + burstofspeedIAS;
    var totalgearIAS = onweaponIAS + offweaponIAS;
    
    // get weapon stats
    var wclass = weaponlist[weapon]["wclass"];
    //alert(wclass);
    var wsm = weaponlist[weapon]["wsm"];
    
    // new EIAS cap for wereforms
    var EIAScap = 75;
    if ((playermorph == "werewolf") || (playermorph == "werebear")){
        EIAScap = 150;
    }
    
    // compute EIAS for display
    // (don't use this value, since it might change if the skill has a bonus/penalty)
    var displayEIAS = ComputeEIAS(totalskillIAS, totalgearIAS, wsm, 0, 0, EIAScap);
    document.getElementById('displayeias').value = displayEIAS;
    
    // get dom elements to manipulate
    var normalattackchartelement = document.getElementById('normalattackchart');
    var normalattackchartbodyelement = document.getElementById('normalattackchartbody');
    var furychartelement = document.getElementById('furychart');
    var furychartbodyelement = document.getElementById('furychartbody');
    //var feralragechartelement = document.getElementById('feralragechart');
    //var feralragechartbodyelement = document.getElementById('feralragechartbody');
    var bitechartelement = document.getElementById('bitechart');
    var bitechartbodyelement = document.getElementById('bitechartbody');
    
    var fireclawslabelelement = document.getElementById('fireclawslabel');
    var maullabelelement = document.getElementById('maullabel');
    var rabieslabelelement = document.getElementById('rabieslabel');
    var feralragelabelelement = document.getElementById('feralragelabel');
    
    var dualwieldnormalattackwarningelement = document.getElementById('dualwieldnormalattackwarning');
    var dualwieldferalragewarningelement = document.getElementById('dualwieldferalragewarning');
    
    // clean out the tables
    
    EmptyTable(normalattackchartbodyelement);
    EmptyTable(furychartbodyelement);
    //EmptyTable(feralragechartbodyelement);
    EmptyTable(bitechartbodyelement);
    
    // compute normal attack
    CalculateSingleTable(normalattackchartbodyelement, "normalattack", playerclass, playermorph, onweaponIAS, offweaponIAS, totalskillIAS, wclass, wsm, EIAScap);

    if ((playerclass == "druid") && ((playermorph == "werewolf") || (playermorph == "werebear"))){
        fireclawslabelelement.style.display = "inline";
    }
    else {
        fireclawslabelelement.style.display = "none";
    }
    if ((playerclass == "druid") && (playermorph == "werebear")){
        maullabelelement.style.display = "inline";
    }
    else {
        maullabelelement.style.display = "none";
    }
    
    if ((playerclass == "barbarian") || (playerclass == "assassin")){
        dualwieldnormalattackwarningelement.style.display = "inline";
    }
    else {
        dualwieldnormalattackwarningelement.style.display = "none";
    }
    
    if (playermorph == "werewolf"){
       feralragelabelelement.style.display = "inline";
    }
    else {
        feralragelabelelement.style.display = "none";
    }
    
    // compute Feral Rage if a werewolf
    /*
    if (playermorph == "werewolf"){
        
        feralragechartelement.style.display = "block";
        CalculateSingleTable(feralragechartbodyelement, "feralrage", playerclass, playermorph, onweaponIAS, offweaponIAS, totalskillIAS, wclass, wsm, EIAScap);
        
        if ((playerclass == "barbarian") || (playerclass == "assassin")){
            dualwieldferalragewarningelement.style.display = "inline";
        }
        else {
            dualwieldferalragewarningelement.style.display = "none";
        }
        
    }
    else {
        feralragechartelement.style.display = "none";
    }
    */
        
    // compute Fury if a druid and a werewolf
    if ((playerclass == "druid") && (playermorph == "werewolf")){
        furychartelement.style.display = "block";
        CalculateSingleTable(furychartbodyelement, "fury", playerclass, playermorph, onweaponIAS, offweaponIAS, totalskillIAS, wclass, wsm, EIAScap);
    }
    else {
        furychartelement.style.display = "none";
    }
    
    // compute bite attacks if a druid
    if ((playerclass == "druid") && ((playermorph == "werewolf") || (playermorph == "werebear"))){
        bitechartelement.style.display = "block";
        CalculateSingleTable(bitechartbodyelement, "bite", playerclass, playermorph, onweaponIAS, offweaponIAS, totalskillIAS, wclass, wsm, EIAScap);
        if (playermorph == "werewolf"){
            rabieslabelelement.style.display = "inline";
        }
        else {
            rabieslabelelement.style.display = "none";
        }
        
    }
    else {
        bitechartelement.style.display = "none";
    }
    
    
    
    
}

function GetPlayerClass(){
    var select = document.getElementById('playerclass');
    var value = select.options[select.selectedIndex].value;
    return value;
}

function GetPlayerMorph(){
    var select = document.getElementById('playermorph');
    var value = select.options[select.selectedIndex].value;
    return value;
}

function GetWerewolfLevel(){
    return Number(document.getElementById('werewolflevel').value);
}

function GetMaulLevel(){
    return Number(document.getElementById('maullevel').value);
}

function GetMaulCharges(){
    return Number(document.getElementById('maulcharges').value);
}

function GetMaulMaxCharges(){
    return Number(document.getElementById('maulmaxcharges').value);
}

function GetFanaticismLevel(){
    return Number(document.getElementById('fanaticismlevel').value);
}

function GetBurstOfSpeedLevel(){
    return Number(document.getElementById('burstofspeedlevel').value);
}

function GetWeapon(){
    var select = document.getElementById('weapon');
    var value = select.options[select.selectedIndex].value;
    return value;
}

function GetOnWeaponIAS(){
    return Number(document.getElementById('weaponIAS').value);
}

function GetOffWeaponIAS(){
    return Number(document.getElementById('nonweaponIAS').value);
}


function UpdateAll(){
    if (BlankInputsExist()){
        return;
    }
    if (CorrectNegativeInputs()){
        return;
    }
    UpdateUI();
    RecalculateTables();
}

function UpdateUI(){
    if (BlankInputsExist()){
        return;
    }
    if (CorrectNegativeInputs()){
        return;
    }
    UpdateMorphUI();
    UpdateWerewolfUI();
    UpdateWerebearUI(false);
    UpdateBurstOfSpeedUI();
    UpdateWeaponListUI();
    UpdateWeaponDetailsUI();
    //alert("done");
}

function RemoveOptions(selectElement) {
    var i, L = selectElement.options.length - 1;
    for(i = L; i >= 0; i--) {
        selectElement.remove(i);
    }
}

function EmptyTable(tablebodyelement){
    while (tablebodyelement.firstChild){
        tablebodyelement.removeChild(tablebodyelement.firstChild);
    }
}

function UpdateMorphUI(){
    var oldmorph = GetPlayerMorph();
    var morphelement = document.getElementById('playermorph');
    RemoveOptions(morphelement);
    var newelement = document.createElement("option");
    newelement.textContent = "Human";
    newelement.value = "human";
    morphelement.appendChild(newelement);
    var playerclass = GetPlayerClass();
    if ((playerclass == "druid") || (playerclass == "barbarian")){
        newelement = document.createElement("option");
        newelement.textContent = "Werewolf";
        newelement.value = "werewolf";
        morphelement.appendChild(newelement);
    }
    newelement = document.createElement("option");
    newelement.textContent = "Werebear";
    newelement.value = "werebear";
    morphelement.appendChild(newelement);
    for(var i = 0; i < morphelement.options.length; i++){
        if(morphelement.options[i].value == oldmorph){
            morphelement.options[i].selected = true;
        }
    }
}

function UpdateWerewolfUI(){
    var morph = GetPlayerMorph();
    var wolflevelelement = document.getElementById('werewolflevel');
    if (morph == 'werewolf'){
        wolflevelelement.disabled = false;
    }
    else {
        wolflevelelement.value = 0;
        wolflevelelement.disabled = true;
    }
}

function UpdateWerebearUI(maxout){
    var morph = GetPlayerMorph();
    var pclass = GetPlayerClass();
    var maullevelelement = document.getElementById('maullevel');
    var maulchargeelement = document.getElementById('maulcharges');
    var maulmaxchargeelement = document.getElementById('maulmaxcharges');
    var newbear = maullevelelement.disabled;
    if ((morph == 'werebear') && (pclass == "druid")){
        maullevelelement.disabled = false;
        maulchargeelement.disabled = false;
        var maxcharges = 0;
        var maullevel = GetMaulLevel();
        if (maullevel > 0){
            maxcharges = TruncateToInt(maullevel/2)+3;
        }
        maulmaxchargeelement.value = maxcharges;
        if (newbear || maxout || (GetMaulCharges() > maxcharges)){
            maulchargeelement.value = maxcharges;
        }
        if (GetMaulCharges() < 0){
            maulchargeelement.value = 0;
        }
    }
    else {
        maullevelelement.value = 0;
        maulchargeelement.value = 0;
        maulmaxchargeelement.value = 0;
        maullevelelement.disabled = true;
        maulchargeelement.disabled = true;
    }
}

function UpdateBurstOfSpeedUI(){
    var playerclass = GetPlayerClass();
    var boslevelelement = document.getElementById('burstofspeedlevel');
    if (playerclass == 'assassin'){
        boslevelelement.disabled = false;
    }
    else {
        boslevelelement.value = 0;
        boslevelelement.disabled = true;
    }
}


function UpdateWeaponListUI(){
    var oldweapon = GetWeapon();
    var weaponelement = document.getElementById('weapon');
    RemoveOptions(weaponelement);
    var playerclass = GetPlayerClass();
    //alert(weaponlist);
    for (var key in weaponlist) {
        if (
            ((playerclass == "assassin") || (weaponlist[key]["wclass"] != "wHT1")) &&
            ((playerclass == "amazon") || !weaponlist[key]["zononly"]) &&
            ((playerclass == "sorceress") || !weaponlist[key]["isorb"])
            // TODO add logic for mercs
        ){
            var newelement = document.createElement("option");
            newelement.textContent = weaponlist[key]["printname"];
            newelement.value = key;
            weaponelement.appendChild(newelement);
        }
    }
    for (var i = 0; i < weaponelement.options.length; i++){
        if(weaponelement.options[i].value == oldweapon){
            weaponelement.options[i].selected = true;
        }
    }
}

function UpdateWeaponDetailsUI(){
    var weapon = GetWeapon();
    var wclasselement = document.getElementById('wclass');
    var wsmelement = document.getElementById('wsm');
    var onweaponiaselement = document.getElementById('weaponIAS');
    wclasselement.value = animationames[weaponlist[weapon]["wclass"]];
    wsmelement.value = weaponlist[weapon]["wsm"];
    if (weapon == "unarmed"){
        onweaponiaselement.value = 0;
        onweaponiaselement.disabled = true;
    }
    else {
        onweaponiaselement.disabled = false;
    }
}


function MaulChanged(){
    if (BlankInputsExist()){
        return;
    }
    var charges = GetMaulCharges();
    var maxcharges = GetMaulMaxCharges();
    if (charges == maxcharges){
        UpdateWerebearUI(true);
    }
    else {
        UpdateWerebearUI(false);
    }
    RecalculateTables();
}

function WeaponChanged(){
    if (BlankInputsExist()){
        return;
    }
    UpdateWeaponDetailsUI();
    RecalculateTables();
}


function BlankInputsExist(){
    
    var testme = GetWerewolfLevel();
    if (Number.isNaN(testme)){
        return true;
    }
    testme = GetMaulLevel();
    if (Number.isNaN(testme)){
        return true;
    }
    testme = GetMaulCharges();
    if (Number.isNaN(testme)){
        return true;
    }
    testme = GetFanaticismLevel();
    if (Number.isNaN(testme)){
        return true;
    }
    testme = GetBurstOfSpeedLevel();
    if (Number.isNaN(testme)){
        return true;
    }
    testme = GetOnWeaponIAS();
    if (Number.isNaN(testme)){
        return true;
    }
    testme = GetOffWeaponIAS();
    if (Number.isNaN(testme)){
        return true;
    }
    
    return false;
}

function CorrectNegativeInputs(){
    if (GetWerewolfLevel() < 0){
        document.getElementById('werewolflevel').value = 0;
        return true;
    }
    if (GetMaulLevel() < 0){
        document.getElementById('maullevel').value = 0;
        UpdateWerebearUI(false);
        return true;
    }
    if (GetMaulCharges() < 0){
        document.getElementById('maulcharges').value = 0;
        return true;
    }
    if (GetFanaticismLevel() < 0){
        document.getElementById('fanaticismlevel').value = 0;
        return true;
    }
    if (GetBurstOfSpeedLevel() < 0){
        document.getElementById('burstofspeedlevel').value = 0;
        return true;
    }
    if (GetOnWeaponIAS() < 0){
        document.getElementById('weaponIAS').value = 0;
        return true;
    }
    if (GetOffWeaponIAS() < 0){
        document.getElementById('nonweaponIAS').value = 0;
        return true;
    }
    return false;
}
