/*
 * Everything that looks like a floor() or ceiling() in D2 is probably the result of truncation following C++ integer division.
 * Floating point operations were too slow for gaming on some of the consumer hardware in service in the late 90s.
 * So fixed-point types were used. Hence all the <<8 and >>8.
 * In **modern** C++, truncation means "round towards zero."
 * However, apparently this was "implementation defined" until C99/C++11.
 *      see:
 *          https://en.wikipedia.org/wiki/Modulo_operation#cite_note-c-13
 *          https://stackoverflow.com/questions/319880/integer-division-rounding-with-negatives-in-c
 * 
 * So it's possible D2 was compiled with something that instead did "round towards negative infinity."
 * In fact, I believe it likely was, because I cannot otherwise make some pre-2.4 dual wield WSM calculations match the observed values.
 * 
 * Which raises the question of what D2R does, presumably on a modern compiler...
 * I'm going to **assume** that D2R is compiled on something that follows the modern spec.
 * Since javascript's Math.floor() rounds towards negative infinity, we need this function:
*/
function TruncateToInt(input){
    return (input >= 0) ? Math.floor(input) : Math.ceil(input);
}

/*
 * Computes EAIS and applies the specified cap
 * Inputs:
 * skillias: total IAS from skills
 * gearias: total IAS from gear (if dual weilding, exclude the weapon that's not performing this hit)
 * wsm: The active weapon's WSM value
 *      Complicated if dual weilding.
 *      Traditionally was active_weapon_WSM - TruncateToInt((gloves_side_weapon_WSM - boots_side_weapon_WSM)/2)
 *      My minimally-tested *guess* is that 2.4PTR does the following:
 *          Normal attack now uses each weapon totally independently with no influence from the other.
 *          Two-swing skills do the full EIAS calculation for each weapon, then average them, then apply to both.
 * sequencefactor: -30 for sequence skills (Jab, Impale, Frenzy, Double Throw, Double Swing, Fists of Fire, Dragon Claw, Claws of Thunder, Blades of Ice); 0 for everything else
 * skillfactor: 50 for Double Swing, 0 for everything else
 * eiascap: traditionally 175, but is 250 for wereforms in 2.4PTR2
 * TODO: add slowing effects
*/
function ComputeEIAS(skillias, gearias, wsm, sequencefactor, skillfactor, eiascap){
    var output = 100 + skillias + TruncateToInt((120 * gearias)/(120 + gearias)) - wsm + sequencefactor + skillfactor;
    output = Math.min(output, eiascap);
    output = Math.max(output, 15);
    return output;
}

// These functions to help us know where to stop the table-making loop
// The limit of (120*x)/(120+x) as x->infinity is 120
function ComputeMaxEIAS(skillias, wsm, sequencefactor, skillfactor, eiascap){
    return 100 + skillias + 120 - wsm + sequencefactor + skillfactor;
}

function DiminishingReturnsLimitReached(x){
    return (Math.ceil((120*x)/(120+x)) >= 120) ? true : false;
}

/*
 * This is the main FPA calculating function!
 * 
 * (The notes are much longer than the function.)
 * 
 * Instead of trying to derive formulae, I'm just going to simulate the animation process
 * based on descriptions of reverse engineering the machine code via debugger.
 * This makes for MUCH more readable code than formula-based IAS calculators,
 * and also avoids the problems of potentially screwing up edge cases in deriving the formulae.
 * 
 * Unfortunately, there are some points of contention that must be resolved.
 * 
 * 
 * TitanSeal describes the basic animation loop as:
 *      1. Increase counter by a speed-dependent increment.
 *      2. Check if counter >= animation length; If so, abort and instead show first frame of next animation.
 *      3. Check if we reached (or skipped over) an action frame; If so, process it.
 *      4. Display current frame.
 *      5. Loop to 1.
 * See:
 *      https://web.archive.org/web/20120806103144/http://diablo3.ingame.de/forum/strategie-archiv-105/faq-bewegungs-und-animationsgeschwindigkeiten-teil-1-a-1220961/
 *      https://web.archive.org/web/20110919065203/http://diablo3.ingame.de/forum/strategie-archiv-105/faq-bewegungs-und-animationsgeschwindigkeiten-teil-2-a-1221988/
 * There are two issues here:
 * (1) Since the counter is increased first, we will never see frame000 unless the increment is less than 256.
 * That's not totally implausible, but it seems odd.
 * (2) He doesn't have a coherent explanation for the extra frame on sequence animations.
 * The "common wisdom" is that non-sequence animations start and end with a neutral frame,
 * and that this frame is allowed to do double duty for adjacent animations, thus skipping one frame.
 * However, TitanSeal flatly rejects this.
 * He claims instead that the -1 in the non-sequence formula is due to aborting when the counter exceeds the animation length.
 * However, that makes no sense.
 * If that were the case, and sequence animations don't abort because they don't have the -1,
 * then his pseudo-code would lead to sequence animations displaying a final frame for which no art exists.
 * That can't be right. The extra frame has to come from *somewhere*.
 * 
 * 
 * Myrdinn describes the basic animation loop the same as TitanSeal, with one difference:
 * There is a tick0 during which the animation's first frame is displayed,
 * but then, without explanation, Myrdinn doesn't count that towards the total frames.
 * (Also, Myrdinn says in the description for Tick 17 that he's been fibbing about the first line of the loop;
 * It actually checks the counter's value after it's been incremented, not before.
 * (I have no idea why he did this. It makes it even harder to follow.)
 * see: https://www.theamazonbasin.com/forums/index.php?/forums/topic/90231-amazon-zeal-attack-speed/
 * This post is very valuable/authoritative because it's basically annotated debugger output.
 * But it's also very hard to read due to the confusing English and poor formatting.
 * 
 * 
 * Hammerman describes the basic animation loop as:
 *      1. Display current frame.
 *      2. Check if provisional next counter would exceed animation length; don't loop if so.
 *      3. Check if provisional next counter would reach or skip over an action frame; if so, process it.
 *      4. Increment counter
 *      5. Loop to 1.
 * See: https://www.theamazonbasin.com/forums/index.php?/forums/topic/119196-calculator-inaccuracy-for-frenzy-attack-speed/
 * At first glance, this seems to be the same as TitanSeal's description, just out of phase.
 * However, there are two differences:
 * (1) Frame000 is always displayed on the first tick.
 * (2) An action frame is processed on the tick *before* that action frame becomes the current frame.
 * This second difference is important in the context of Frenzy (which Hammerman is discussing)
 * because the increment gets recalculated when Frenzy hits.
 * 
 * Now, here is where things become a headache:
 * (Well, they *were* a headache up until Warren1001's testing showed that Feral Rage lost its special behavior in 2.4 PTR2...)
 * I can only make a calculator match observed data for pre-2.4 Frenzy if it uses the "lookahead"
 * processing of action frames as described by Hammerman.
 * BUT I can only make a calculator match observed data for rollback skills if action frames are
 * processed *after* they become the current frame.
 * I keep thinking there must be some way to rewrite this into one elegant loop that handles both cases correctly.
 * But I have not been able to do so. Ultimately I used an ugly cludge to handle one case.
 * All this suggests a fundamental misapprehension lurking somewhere, but I can't untangle it.
 * 
 * 
 * jrichard describes the animation loop the same as TitanSeal.
 * see: https://www.diabloii.net/forums/threads/since-the-kick-calculations-are-off-someone-please-help-with-this-question.222223/post-2267201
 * I believe the odd bit about how an action frame "has to happen" is just an awkward way of saying
 * that tables/formulae are sometimes wrong because they don't consider *which* frame gets skipped.
 *
 * 
 * This post by Myrdinn has the ASM for how rollback works:
 * https://www.theamazonbasin.com/forums/index.php?/forums/topic/90231-amazon-zeal-attack-speed/page/2/#comment-1112818
 * This post by Fuzzier has a good pseudo-code summary:
 * https://www.theamazonbasin.com/forums/index.php?/forums/topic/107343-rollback/
 * 
 * 
 * TitanSeal explains Feral Rage's quirky behavior as:
 * If the attack hits, the increment is doubled for the remainder of the animation.
 * (Which raises the question of whether this needs to be addressed the same as Frenzy with the "lookahead" described by Hammerman...)
 * see: 
 *      https://planetdiablo.eu/forum/threads/faq-bewegungs-und-animationsgeschwindigkeiten-teil-2.1221988/#post-17669550
 *      https://web.archive.org/web/20110919065203/http://diablo3.ingame.de/forum/strategie-archiv-105/faq-bewegungs-und-animationsgeschwindigkeiten-teil-2-a-1221988/
 * BUT!!!!! Warren1001's testing showed that Feral Rage lost its special behavior in 2.4 PTR2.
 * 
 * 
 * This post explains how dual-wield wolfbarbs worked before:
 * https://www.theamazonbasin.com/forums/index.php?/forums/topic/123238-dual-wield-shifter-barb-question/#comment-1534433
 * However, this is **changed** now:
 *      Normal attack is bugged.
 *      You hit once and then never hit again until you morph, switch weapons, or go to town.
 *      Attack skill speed is wholly based on the primary weapon.
 * 
 * 
 * Where to find framesperdirection, startframe, action frames, and animation speed:
 * For normal animations, extract animdata.d2
 * and use animdata_edit to convert it to a comma-separated-value text file.
 * For sequence animations, they need to be extracted from d2common.dll (or D2R's analog for that...)
 * They can be found here:
 * https://web.archive.org/web/20210212080938/https://diablo3.ingame.de/forum/threads/1221989-FAQ-Bewegungs-und-Animationsgeschwindigkeiten-Teil-3?postcount=2
 * 
 * 
 * Ultimately, I decide to emulate the animation loop as described by TitanSeal with 2 differences:
 * 1) The extra frame on sequence animations has to come from **somewhere**.
 * I think the most plausible explanation is the convetional wisdom is indeed correct -- 
 * non-sequence animations are skipping tick 0.
 * Accordingly, I add a tick to the front for sequence animations.
 * (Something of a moot point since wereforms have no sequence animations.)
 * 2) For skills that change the increment when they hit, I've used an ugly cludge to
 * simulate the "lookahead" behavior described by Hammerman.
 * This is very likely wrong as a faithful reproduction of what's going on inside D2,
 * but it produces results that match the empircal tests.
 * (And since Feral Rage lost this behavior, it's kind of a moot point anyway.)
*/
function CalculateFPA(skillname, playerclass, morph, wclass, cappedeias){
    
    // figure out our avatar
    var avatar = playerclass;
    if (morph != "human"){
        avatar = morph;
    }
    var iswereform = ((morph == "werewolf") || (morph == "werebear")) ? true : false;
    
    // which animation are we using?
    var animation = skilldata[skillname]["animation"];
    
    // does our avatar care about weapon type with this animation?
    var wclasstouse = wclass;
    if (!framedata[avatar][animation]["weapontypematters"]){
        wclasstouse = "wHTH";
    }
    
    // pull the frame data
    var startframe = framedata[avatar][animation]["perweaponata"][wclasstouse]["startframe"];
    var actionframes = framedata[avatar][animation]["perweaponata"][wclasstouse]["actionframes"];
    var framesperdirection = framedata[avatar][animation]["perweaponata"][wclasstouse]["framesperdirection"];
    var animationspeed = framedata[avatar][animation]["perweaponata"][wclasstouse]["animationspeed"];
    
    // if we are a werform, pull the human form frame data too. 
    // for now assume only A1 and A2 have a slowing factor
    // but it's possible the A1 factor is just applied to everything
    // may need to revise this once bite can be tested more
    var adjustedanimationspeed = animationspeed;
    if (iswereform && ((animation == "A1") || (animation == "A2"))){
        var humanstartframe = framedata[playerclass][animation]["perweaponata"][wclass]["startframe"];
        var humanactionframes = framedata[playerclass][animation]["perweaponata"][wclass]["actionframes"];
        var humanframesperdirection = framedata[playerclass][animation]["perweaponata"][wclass]["framesperdirection"];
        var humananimationspeed = framedata[playerclass][animation]["perweaponata"][wclass]["animationspeed"];
        
        // compute the 2.4 wereform nerf
        // This is a best guess that matches the observed Fury data.
        // (1) I am guessing this replaces the animationspeed term, b/c that's how the old wereform adjustment works
        // (2) The double truncation (here and then when increment is computed) makes a difference.
        // Both single and double truncation fail to match a few observed breakpoints.
        // I'm hoping this is just flaws in the data, since matching both seems impossible.
        // (3) I'm totally guessing about humanstartframe; this needs tested
        adjustedanimationspeed = TruncateToInt((256 * framesperdirection * humananimationspeed)/((humanframesperdirection - humanstartframe) * animationspeed));
    }
    
    // set some variables based on the specific skill
    var hitcount = skilldata[skillname]["hitcount"];
    var isrollbackskill = skilldata[skillname]["isrollbackskill"];
    var rollbackamount = (isrollbackskill) ? skilldata[skillname]["rollbackamount"] : 100;
    var isferalrage = (skillname == "feralrage") ? true : false;
    
    // generic loop variables
    var counter = startframe * 256;
    var actionframeflag = 0;
    var lastactionframe = -1;
    var ticks = (skilldata[skillname]["issequence"]) ? 1 : 0;  // sequence skills don't skip tick0 like everything else does
    var maxcounter = framesperdirection * 256;
    var increment = TruncateToInt((adjustedanimationspeed * cappedeias)/100);
    var prevticks=[0];
    var output_fpa=[];
    var output_actionframes=[];
    
    while (true){
        
        counter += increment;
        if (counter >= maxcounter){
            // abort and load the first frame of next animation instead
            break;
        }
        
        ticks++;
        
        currentframe = TruncateToInt(counter/256);
        
        // see if we hit an action frame
        // (actual code loops a persistent frame counter forward until it hits, but this is cleaner) 
        for (var i=actionframes.length -1 ; i>=0; i--){
            if ((currentframe >= actionframes[i]) && (lastactionframe < actionframes[i])){
                actionframeflag = true;
                lastactionframe = actionframes[i];
                break;
            }
        }
        
        // do things if we hit an action frame
        if (actionframeflag){
            
            actionframeflag = false;
            
            output_actionframes.push(ticks);
            
            // if this is a multi-hit skill and this is not the last hit, save fpa to output
            // TODO: fix for sequence skills based on which frame *looks* like a new attack rather than the actionframes (i.e.,where the sequence table starts drawing from the second animation)
            if (    (isrollbackskill && (hitcount > 1)) ||
                    ((actionframes.length > 1) && (currentframe < actionframes[actionframes.length-1]))
            ){
                output_fpa.push(ticks - prevticks[prevticks.length -1]);
                prevticks.push(ticks);
            }
            
            // do feral rage funny business
            /*
            As per Warren1001's testing, Feral Rage no longer does this in 2.4 PTR2.
            if (isferalrage){
                // as per well-tested case of Frenzy, increment changes apply to THIS tick (see comments above this function)
                counter -= increment;
                increment *= 2;
                counter += increment;
            }
            */
            
            // do rollback
            if (isrollbackskill && (hitcount > 1)){
                newstartframe = TruncateToInt((currentframe * (100 - rollbackamount) ) / 100);
                counter = newstartframe * 256;
                lastactionframe = -1;
                hitcount--;
            }
            
        }     
        
    } //end while true loop

    // save FPA for final hit to output
    output_fpa.push(ticks - prevticks[prevticks.length -1]);
    
    var output = {
        fpa: output_fpa,
        actionframes: output_actionframes
    };
    
    return output;
}


function OutputEquals(output1, output2){
    if (!ArrayEquals(output1["fpa"], output2["fpa"])){
        return false;
    }
    if (!ArrayEquals(output1["actionframes"], output2["actionframes"])){
        return false;
    }
    return true;
}

function ArrayEquals(array1, array2){
    if (!array1){
        return false;
    }
    if (!array2){
        return false;
    }
    if (array1.length != array2.length){
        return false;
    }
    for (var i=0; i<array1.length; i++){
        if (array1[i] != array2[i]){
            return false;
        }
    }
    return true;
}

function ArraySum(array1){
    var output = 0;
    for (var i=0; i<array1.length; i++){
        output += array1[i];
    }
    return output;
}

function PrettyPrintFPAArray(array1){
    var output = "";
    for (var i=0; i<array1.length; i++){
        output += array1[i];
        if (i+1 < array1.length){
            output += "/"
        }
    }
    output += " (" + ArraySum(array1) + ")";
    return output;
}

function PrettyPrintActionFrameArray(array1){
    var output = "";
    for (var i=0; i<array1.length; i++){
        output += array1[i];
        if (i+1 < array1.length){
            output += ","
        }
    }
    return output;
}
