let goal, fieldData;

let botPoints = 0;
let sessionData;

// Array of {points, name}, in increasing points order.
let goals;

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    goals = fieldData["goals"].split(/;/).map((pair) => {
        let p = pair.split(/:/);
        return {points: Number(p[0]),
                name: p[1]};
    });
    goal = goals[goals.length-1].points;
    
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
    for (let i=0; i<goals.length; i++) {
        if (goals[i].points > amount) {
            console.log(`cumulative ${amount} < ${goals[i].points} goal`);
            return i;
        }
    }
    // Cap it at the last goal.
    console.log(`cumulative ${amount} > ${goals[goals.length-1].points} goal`);
    return goals.length-1;
}

// Returns the goal object prior to the one indicated by the index.
function getPreviousGoal(goalIndex) {
    return (goalIndex == 0) ? {points: 0, name: "Start!"} : goals[goalIndex-1];
}

const GOAL_WIDTH = 70;
const GOAL_LMARGIN = 20;
const GOAL_RMARGIN = GOAL_LMARGIN+GOAL_WIDTH;

let formerNextGoalIndex = 0;

function updateBar(amount) {
    let ngIndex = nextGoalIndex(amount);
    console.log(`next goal index = ${ngIndex}`);
    let nextGoal = goals[ngIndex];
    let prevGoal = getPreviousGoal(ngIndex);
    
    console.log(`bracket: ${prevGoal.points} - ${nextGoal.points}`);

    $("#points").html(Math.floor(amount));

    // Lazy-populate the goal bar labels.
    $(`#goal_${ngIndex}`).text(nextGoal.name);
    if (ngIndex > 0) {
        $(`#goal_${ngIndex-1}`).text(prevGoal.name);
    }

    let pctWidth = GOAL_WIDTH * (ngIndex + ( (amount-prevGoal.points) / (nextGoal.points - prevGoal.points)));
    // Update the progress bar width
    $("#bar").css('width', pctWidth + "%");

    // If we're actually moving to a new goal, then
    // trigger the animation of the goalposts.
    if (ngIndex != formerNextGoalIndex) {
        console.log('Triggering animation');
        let origin = -(GOAL_WIDTH * ngIndex);
        $("#goalContainer").css("left", `${origin}%`);
        console.log(`Triggered animation to move origin to ${origin}`);
    }
    formerNextGoalIndex = ngIndex;
}



