#!/bin/bash
mkdir cartellaProvvisoria
cd cartellaProvvisoria
ask clone -s amzn1.ask.skill.7e1717eb-d504-4edf-87c7-19e0fb9ca498
cd ..
node db_script_codiceJS.js
node daily_script_codiceJS.js
cd cartellaProvvisoria/InformationPoint
ask deploy
cd ../..
rm -r cartellaProvvisoria