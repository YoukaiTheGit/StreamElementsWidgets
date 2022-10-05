A Goal progress bar which tracks a combination of custom points, bits, donations, subscriptions, follows, raids, etc, toward multiple goals.

Specify your goals as a semicolon-separated list of POINTS:NAME pairs.  Example:

    10:Send a Tweet;20:ASMR;30:Take a shot

You specify how many "points" each type of support contributes toward the goals.  In addition, you can specify the name of a custom counter which you can manipulate outside of the overlay (via commands, for example):

    !barPoints : I have set the points to ${count botpoints ${1}}
    !addToBar   : I have increased the points to ${count botpoints "+${1}"}
  
