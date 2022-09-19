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

function barParameters(goal1, goal2, amount) {
    // Coordinate system in terms of bar percentages.
    const PG_X = 20;
    const NG_X = 90;
    let rightEdge = PG_X + (amount-goal1.points) / (goal2.points - goal1.points) * (NG_X-PG_X);
    let width = (goal1.points == 0) ? (rightEdge - PG_X) : 100;
    return [rightEdge, width];
}

let formerNextGoalIndex = 0;

function updateBar(amount) {
    let ngIndex = nextGoalIndex(amount);
    console.log(`next goal index = ${ngIndex}`);
    let nextGoal = goals[ngIndex];
    let prevGoal = getPreviousGoal(ngIndex);
    
    console.log(`bracket: ${prevGoal.points} - ${nextGoal.points}`);

    let [rightEdge, width] = barParameters(prevGoal, nextGoal, amount);
    console.log(`progress bar: ${rightEdge}`);
    $("#bar").css('right', `${100 - rightEdge}%`);
    $("#bar").css('width', width + "%");
    $("#points").html(Math.floor(amount));
    
    $("#goal_1").text(prevGoal.name);
    $("#goal_2").text(nextGoal.name);

    // If we're actually moving to a new goal, then
    // trigger the animation of the goalposts.
    if (ngIndex != formerNextGoalIndex) {
        console.log('Triggering animation');
        $("#goal_1").replaceWith($("#goal_1").clone());
        $("#goal_2").replaceWith($("#goal_2").clone());
        if (formerNextGoalIndex == 0) {
            $("#bar").replaceWith($("#bar").clone().addClass("goal_reached"));
        }

        
        console.log('Triggered animation');
    }
    formerNextGoalIndex = ngIndex;
}



