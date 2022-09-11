
import React from 'react';
import '../App.css';
import { mockBears, mockMatchupMap } from '../mockData';
import { Matchup } from '../Matchup/Matchup';
import {  BearType, MatchupMap } from '../types';
import '../App.css';

export const getNextBearField = (matchupId: number) => {
  return matchupId % 2 === 1 ? 'bear1' : 'bear2';
}

export const checkShouldClearDownstream = (pickedWinner?: number, bearId?: number) => {
  return pickedWinner !== undefined && pickedWinner === bearId;
}

export const clearDownstreamMatchups = (matchups: MatchupMap, matchupId: number): MatchupMap => {
  const nextBearField = getNextBearField(matchupId);
  const currentMatchup = matchups[matchupId];
  const nextMatchup = matchups[currentMatchup?.nextMatchup];

  if(!nextMatchup)
    return matchups;

  const shouldClearDownstream = checkShouldClearDownstream(nextMatchup.pickedWinner, nextMatchup[nextBearField]?.id);

  matchups = {
    ...matchups,
    [nextMatchup.id]: {
      ...nextMatchup,
      pickedWinner: shouldClearDownstream ? undefined : nextMatchup.pickedWinner,
      [nextBearField]: undefined
    }
  }

  if(shouldClearDownstream) {
    matchups = clearDownstreamMatchups(matchups, nextMatchup.id);
  }

  return matchups;
}

//TODO: loading logic.
export const Bracket = () => {
  const [matchupMap, setMatchupMap] = React.useState(mockMatchupMap);
  const [champion, setChampion] = React.useState<BearType>();

  const pickWinner = (matchupId: number, bearId: number) => {
    let currentMatchup = matchupMap[matchupId];

    // If picked winner is already the picked bear, do nothing
    if(currentMatchup.pickedWinner === bearId)
      return;

    if(currentMatchup.pickedWinner === champion?.id)
      setChampion(undefined);

    currentMatchup.pickedWinner = bearId;

    let nextMatchup = matchupMap[currentMatchup.nextMatchup];
    let newMatchups = {
      ...matchupMap
    };

    // If there is a next matchup, set the bear to the appropriate field, and clear downstream if needed
    if (nextMatchup) {
      const nextBearField = getNextBearField(matchupId);
      const shouldClearDownstream = checkShouldClearDownstream(nextMatchup.pickedWinner, nextMatchup[nextBearField]?.id);

      
      if(shouldClearDownstream) {
        newMatchups = clearDownstreamMatchups(newMatchups, matchupId);
        // clearDownstream will update the next matchup, so we need to update our nextMatchup object
        nextMatchup = newMatchups[nextMatchup.id];
      }

      nextMatchup[nextBearField] = mockBears.find(bear => bear.id === bearId);

      newMatchups = {
        ...newMatchups,
        [matchupId]: currentMatchup,
        [nextMatchup.id]: nextMatchup
      };

    } else {
      // Otherwise, pick this bear as Championship winner
      newMatchups = {
        ...newMatchups,
        [matchupId]: currentMatchup,
      };

      const pickedChampion = mockBears.find(bear => bear.id === bearId);
      setChampion(pickedChampion);
    }

    setMatchupMap(newMatchups);
  }

  return (
    <div className="container">
      <div className="column">
        <Matchup matchup={matchupMap[1]} pickWinner={pickWinner}/>
        <Matchup matchup={matchupMap[2]} pickWinner={pickWinner}/>
      </div>

      <div className="column round-two">
        <Matchup matchup={matchupMap[5]} pickWinner={pickWinner}/>
        <Matchup matchup={matchupMap[6]} pickWinner={pickWinner}/>
      </div>
      <div className="column center">
        <Matchup matchup={matchupMap[9]} pickWinner={pickWinner}/>
      </div>
      <div className="column center">
        <Matchup matchup={matchupMap[11]} pickWinner={pickWinner}/>
        <div>
          Champion
        </div>
        {champion && 
          <div className="bear">
            <img className="bear-image" data-testid="champion-image" src={require(`../images/${champion?.afterImgSrc}`)} />
            <div className="champion-name" data-testid="champion-name">
              {champion?.tagNumber} {champion?.name}
            </div>
          </div>
        }
      </div>
      <div className="column right center">
        <Matchup matchup={matchupMap[10]} pickWinner={pickWinner}/>
      </div>
      <div className="column right round-two">
        <Matchup matchup={matchupMap[7]} pickWinner={pickWinner}/>
        <Matchup matchup={matchupMap[8]} pickWinner={pickWinner}/>
      </div>

      <div className="column right">
        <Matchup matchup={matchupMap[3]} pickWinner={pickWinner}/>
        <Matchup matchup={matchupMap[4]} pickWinner={pickWinner}/>
      </div>
    </div>
    
  );
}