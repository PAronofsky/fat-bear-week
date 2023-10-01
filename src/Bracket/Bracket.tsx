
import React from 'react';
import Axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { mockBears, mockMatchupMap } from '../mockData';
import { Matchup } from '../Matchup/Matchup';
import { BearType, MatchupMap } from '../types';
import { useUserContext } from '../contexts/userContext';
import LeaderLine from '../leader-line.min'
import '../App.css';

enum Side {
  left,
  right,
  center
}
export const getNextBearField = (matchupId: number) => {
  return matchupId % 2 === 1 ? 'bear1' : 'bear2';
}

export const checkShouldClearDownstream = (pickedWinner?: number, bearId?: number) => {
  return pickedWinner !== undefined && pickedWinner === bearId;
}

const getLeaderOptions = (side: Side) => {
  return {
    path: 'grid',
    endPlug: 'behind',
    color: 'black',
    startSocket: getSocketPosition(side, true),
    endSocket: getSocketPosition(side, false),
  }
}

const getSocketPosition = (side: Side, start: boolean) => {
  switch(side) {
    case Side.left:
      return start ? 'right': 'left'
    case Side.right:
      return start ? 'left' : 'right'
    default:
      return start ? 'top': 'bottom'
  }
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

// Makeshift Type
type LeaderLineType = {
  remove: () => void
}

let leaderLines: LeaderLineType[] = []
const drawLeaderLines = () => {
  leaderLines.push(drawLeaderLine('node-1-0', 'node-5-0', Side.left))
  leaderLines.push(drawLeaderLine('node-1-1', 'node-5-0', Side.left))

  leaderLines.push(drawLeaderLine('node-5-0', 'node-9-0', Side.left))
  leaderLines.push(drawLeaderLine('node-5-1', 'node-9-0', Side.left))

  leaderLines.push(drawLeaderLine('node-2-0', 'node-6-0', Side.left))
  leaderLines.push(drawLeaderLine('node-2-1', 'node-6-0', Side.left))

  leaderLines.push(drawLeaderLine('node-6-0', 'node-9-1', Side.left))
  leaderLines.push(drawLeaderLine('node-6-1', 'node-9-1', Side.left))

  leaderLines.push(drawLeaderLine('node-9-0', 'node-11-0', Side.left))
  leaderLines.push(drawLeaderLine('node-9-1', 'node-11-0', Side.left))


  leaderLines.push(drawLeaderLine('node-3-0', 'node-7-0', Side.right))
  leaderLines.push(drawLeaderLine('node-3-1', 'node-7-0', Side.right))

  leaderLines.push(drawLeaderLine('node-7-0', 'node-10-0', Side.right))
  leaderLines.push(drawLeaderLine('node-7-1', 'node-10-0', Side.right))

  leaderLines.push(drawLeaderLine('node-4-0', 'node-8-0', Side.right))
  leaderLines.push(drawLeaderLine('node-4-1', 'node-8-0', Side.right))

  leaderLines.push(drawLeaderLine('node-8-0', 'node-10-1', Side.right))
  leaderLines.push(drawLeaderLine('node-8-1', 'node-10-1', Side.right))

  leaderLines.push(drawLeaderLine('node-10-0', 'node-11-1', Side.right))
  leaderLines.push(drawLeaderLine('node-10-1', 'node-11-1', Side.right))

  leaderLines.push(drawLeaderLine('node-11-0', 'champion-container', Side.center))
}

const drawLeaderLine = (start: string, end: string, side: Side) => {
  return new LeaderLine(
    document.getElementById(start),
    document.getElementById(end), 
    getLeaderOptions(side)
  )
}

const repositionLeaderLines = () => {
  removeLeaderLines()
  drawLeaderLines()
}

const removeLeaderLines = () => {
  leaderLines.forEach(line => {
    line.remove()
  })
  leaderLines = []
}

//TODO: loading logic.
export const Bracket = () => {
  const [matchupMap, setMatchupMap] = React.useState(mockMatchupMap);
  const [champion, setChampion] = React.useState<BearType>();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const navigate = useNavigate();
  const { user } = useUserContext();

  // Preload images
  // const bearsRef = React.useRef(mockBears)
  // React.useEffect(() => {
  //   bearsRef.current.forEach((bear) => {
  //     const img = new Image();
  //     img.src = bear.beforeImgSrc || '';
  //   });
  // }, []);

  React.useEffect(() => {
    let isCancelled = false;

    const getBracket = async () => {
      try {
        await Axios.post("/bracket/get", {token: user?.token }).then((response) => {
          if(isCancelled) {
            return;
          }

          const bracketMap = response?.data?.bracketMap;
          if(bracketMap) {
            setMatchupMap(bracketMap);
            if(bracketMap[11] && bracketMap[11].pickedWinner) {
              const pickedChampion = mockBears.find(bear => bear.id === bracketMap[11].pickedWinner);
              setChampion(pickedChampion);
            }
          } else {
            console.log("oh nooo bracket not found.")
          }

          drawLeaderLines()
        })
      } catch {
        console.log("oh nooo bracket fetching failed.")
      }
    }

    if(user) {
      getBracket();
    }

    return () => {
      isCancelled = true;
      removeLeaderLines()
    }

  }, [navigate, user]);

  const pickWinner = (matchupId: number, bearId: number) => {
    let currentMatchup = matchupMap[matchupId];

    // If picked winner is already the picked bear, do nothing
    if(currentMatchup.pickedWinner === bearId)
      return;

    setShowSuccess(false);

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
    setTimeout(() => {
      repositionLeaderLines()
    }, 100)
  }

  const submitBracket = async () => {
    try {
      await Axios.post("/bracket/update-create", { token: user?.token, bracketMap: matchupMap}).then((response) => {
          setShowSuccess(true);
          console.log("bracket saved")
        });
    } catch(e) {
      console.log("oh nooo bracket saving failed.")
    }
  }

  return (
    <div className="page-container">
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
          <div id="champion-container" className="champion-container">
            <div className="column center">
              <div>
                Champion
              </div>
              {champion && (<img className="bear-image shadowed" data-testid="champion-image" src={require(`../images/${champion?.afterImgSrc}`)} alt="champion profile"/>)}
              <div className="champion-name" data-testid="champion-name">
                {champion?.tagNumber} {champion?.name}
              </div>
              <button className="btn btn-secondary btn-sm shadowed" onClick={submitBracket} disabled={!champion}>Submit</button>
              {showSuccess && 
                <div>Success!</div>
              }
            </div>
          </div>
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
