I am using web3 at the moment but considering rewriting the whole server to ethersjs and typescript. i need it to 

- provide a rpc server with user password port choice
- connect to etherem to send trnasactions
- provide a briding layer between two blockchains
- use node libraries that already exist

all the files in the project are the bridge keeper, the main functions of the bridgekeeper are to

- provide rpc server to a verus node, the main conenction is in the index.js
- take the commands from the allowed list in apifunctions.js and process them when the verus node calls them
- use the main functions in ethinteractor.js to condition the data and then send to the chain or interrogate the ethereum chain when needed.


task 1:

layout the frame work on

- how the files will be structiored 
- how the code and classes are structured
- how the program launches (via command line e.g. yarn start or being imported into another program and exports.start being called from index.js)
- the program must ahve a super clean folder structure and file structure a lot more files and folders than there are currently with classes 
- use the folder newbridge and create a plan folder in there and put in the task_1.md plan we come up with
- analyse the current code starting with teh entry point index.js and also there are utility functions that at the moment are manually run by doing e.g. 
node upgrade.js -createmultisigrevoke iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB iChhvvuUPn7xh41tW91Aq29ah9FNPRufnJ RLXCv2dQPB4NPqKUweFx4Ua5ZRPFfN2F6D these are ok but better if we change them to a cli menu system people can interact with like a command line linux setup grpahics style that re scales with the page and has menus for the activities

- provide a cache of the ethereum called replies to save as much ehteresjs calls as possible 