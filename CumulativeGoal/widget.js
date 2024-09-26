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
    goals = fieldData.goals.split(/;/)
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
        botPoints = parseBotPoints(counter.value);
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
        botPoints = parseBotPoints(data.value);
        analysePoints();
    }
});

function parseBotPoints(value) {
    let i = parseInt(value, 10);
    return isNaN(i) ? 0 : i;
}


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
    console.log(`${subsAmount} ${tipsAmount} ${bitsAmount} ${followerAmount} ${botPoints}`);
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


let latestAmount = 0;
let currentAmount = 0;
let updateTimer = null;
let firstTime = true;

function updateBar(amount) {
  console.log(`${Date.now()}: requested update to ${amount}`);
  latestAmount = amount;
  
  if (updateTimer === null) {
      updateTimer = setTimeout(() => {
          updateTimer = null;
   	  if (latestAmount != currentAmount) {
      	      console.log(`${Date.now()}: updating to ${latestAmount}`);      
      	      realUpdateBar(latestAmount, firstTime);
      	      currentAmount = latestAmount;
    	  }
      }, firstTime ? 0 : 2100);
      firstTime = false;
  }
}

const GOAL_WIDTH = 70;
const GOAL_LMARGIN = 20;
const GOAL_RMARGIN = GOAL_LMARGIN+GOAL_WIDTH;

let formerNextGoalIndex = 0;
let formerAmount = 0;


function realUpdateBar(amount, firstTime) {
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
        }, firstTime ? 0 : 2000);
    }
    // $("#bar").css('width', `${pctWidth}%`);
    formerAmount = amount;

    // If we're actually moving to a new goal, then
    // trigger the animation of the goalposts.
    if (ngIndex != formerNextGoalIndex) {
        console.log(`Triggering animation for new index ${ngIndex} (was ${formerNextGoalIndex})`);

        // Slide the bar so the new goal is in view
        let origin = `${-(GOAL_WIDTH * ngIndex)}%`;
        console.log(`Triggered animation to move origin to ${origin}`);

        // The first update is just after the page loads.  Don't animate, just
        // jump right to it.
        if (!firstTime) {
            $("#goalContainer").animate({left: origin}, 2000);

            if (ngIndex > formerNextGoalIndex) {
                // Show the celebration animation
                $("#firework").css('left', `${GOAL_WIDTH * ngIndex + GOAL_LMARGIN}%`); // .css('opacity', 1);
                $("#firework").show();
                
                // And play the celebration sound
                let audio = $("#audio")[0];
                audio.play();

                setTimeout(() => {$("#firework").hide();}, 7000);
                // Why doesn't this animation work?
                // .delay(5000).hide(); /* .animate({opacity: 0}, 1000).delay(1000) */
            }
        } else {
            $("#goalContainer").css("left", origin);
        }
        
    }
    formerNextGoalIndex = ngIndex;
}



