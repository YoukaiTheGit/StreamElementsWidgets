let goal, fieldData;

let botPoints = 0;
let sessionData;

// Array of {points, name}, in increasing points order.
let goals;

window.addEventListener('onWidgetLoad', function (obj) {
    let goalTemplate = $('#goal_template');
    let goalContainer = $('#goalContainer');
    // Parse the semicolon-delimited list of POINTS:GOALNAME pairs
    fieldData = obj.detail.fieldData;
    let maxPoints = 0;
    goals = fieldData["goals"].split(/;/)
        .concat(["0:To Infinity And Beyond!"])
        .map((pair, index) => {
            let p = pair.split(/:/);
            // Dynamically create the goal milestone widgets as we go
            let g = goalTemplate.clone()
                .attr('id', `goal_${index}`)
                .css("left", `${20+70*index}%`);

            pts = Number(p[0]);

            // I would have liked these to be elements already in the template, that I populate
            // with the contents.  But it wasn't working with jquery.
            g.append($('<span class="goalName">').text(p[1]));
            g.append($('<span class="goalPoints">').text(pts));
            goalContainer.append(g);
            g.show();

            maxPoints = Math.max(maxPoints, pts);
            return {points: maxPoints,
                    name: p[1]};
        });
    sessionData = obj["detail"]["session"]["data"];
    SE_API.counters.get(fieldData.botCounterName).then(counter => {
        botPoints = parseInt(counter.value);
        analysePoints();
    });
});

window.addEventListener('onSessionUpdate', function (obj) {
    sessionData = obj["detail"]["session"];
    analysePoints();
});

window.addEventListener('onEventReceived', function (obj) {
    const listener = obj.detail.listener;
    const data = obj.detail.event;
    if (listener === 'bot:counter' && data.counter === fieldData.botCounterName) {
        botPoints = parseInt(data.value);
        analysePoints();
    }
});


function analysePoints() {
    let data = sessionData;
    let bitsAmount = data["cheer-goal"]["amount"];
    let subsAmount = data["subscriber-goal"]["amount"];
    let tipsAmount = data["tip-goal"]["amount"];
    let followerAmount = data["follower-goal"]["amount"];
    let currentPoints = subsAmount * fieldData.pointsPerSub;
    currentPoints += tipsAmount * fieldData.pointsPerTip;
    currentPoints += bitsAmount * fieldData.pointsPerBit / 100;
    currentPoints += followerAmount * fieldData.pointsPerFollow;
    currentPoints += botPoints * fieldData.pointsPerCounter;
    updateBar(currentPoints);
}

// Returns the index of the next goal strictly greater than the given
// number of points.

function nextGoalIndex(amount) {
    let maxPoints = 0;
    for (let i=0; i<goals.length; i++) {
        maxPoints = goals[i].points;
        if (goals[i].points > amount) {
            console.log(`cumulative ${amount} < ${goals[i].points} goal`);
            return i;
        }
    }
    
    // If we blow past the final pseudo-goal, extend the pseudo-goal to contain the amount.
    console.log(`cumulative ${amount} > ${goals[goals.length-1].points} goal`);
    goals[goals.length-1].points = amount * 1.1;
    return goals.length-1;
}

// Returns the goal object prior to the one indicated by the index.
function getPreviousGoal(goalIndex) {
    return (goalIndex == 0) ? {points: 0, name: "Start!"} : goals[goalIndex-1];
}

let currentTargetVersion = 0;

function updateBar(amount) {
    // Batch up multiple updates (e.g., many gift subs) and only
    // process the last one.
    currentTargetVersion++;
    let newVersion = currentTargetVersion;
    setTimeout(function() {versionedUpdateBar(newVersion, amount);},
               2000);
}

const GOAL_WIDTH = 70;
const GOAL_LMARGIN = 20;
const GOAL_RMARGIN = GOAL_LMARGIN+GOAL_WIDTH;

let formerNextGoalIndex = 0;
let formerAmount = 0;

function versionedUpdateBar(ver, amount) {
    if (ver != currentTargetVersion) return; // More updates on the way
    
    let ngIndex = nextGoalIndex(amount);
    console.log(`next goal index = ${ngIndex}`);
    let nextGoal = goals[ngIndex];
    let prevGoal = getPreviousGoal(ngIndex);
    
    console.log(`bracket: ${prevGoal.points} - ${nextGoal.points}`);

    $("#points").html(Math.floor(amount));

    let pctWidth = GOAL_WIDTH * (ngIndex + ( (amount-prevGoal.points) / (nextGoal.points - prevGoal.points)));
    // Update the progress bar width
    // Animate it if it has changed
    if (formerAmount != amount) {
        $("#bar").animate({
            width: `${pctWidth}%`
        }, 2000);
    }
    // $("#bar").css('width', `${pctWidth}%`);
    formerAmount = amount;

    // If we're actually moving to a new goal, then
    // trigger the animation of the goalposts.
    if (ngIndex != formerNextGoalIndex) {
        console.log('Triggering animation');
        let origin = -(GOAL_WIDTH * ngIndex);
        // $("#goalContainer").css("left", `${origin}%`);
        $("#goalContainer").animate({left: `${origin}%`}, 2000);
        console.log(`Triggered animation to move origin to ${origin}`);
        
        $("#firework").css('left', `${GOAL_WIDTH * ngIndex + GOAL_LMARGIN}%`); // .css('opacity', 1);
        $("#firework").show();
        setTimeout(() => {$("#firework").hide();}, 7000);
        // .delay(5000).hide(); /* .animate({opacity: 0}, 1000).delay(1000) */
        
    }
    formerNextGoalIndex = ngIndex;
}



