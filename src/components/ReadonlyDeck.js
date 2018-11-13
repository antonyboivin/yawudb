import React, { PureComponent } from 'react';
import ObjectiveScoreTypeIcon from './ObjectiveScoreTypeIcon';
import { Typography, IconButton, Menu, MenuItem, } from '@material-ui/core';
import { setsIndex, cardTypeIcons, idPrefixToFaction, cardType, totalCardsPerWave } from '../data/index';
import AnimateHeight from 'react-animate-height';
import { Set } from 'immutable';
import MoreVerticalIcon from '@material-ui/icons/MoreVert';
import * as jsPDF from 'jspdf';

const SetIcon = ({ id, set }) => (
    <img id={id} style={{margin: 'auto .1rem', width: '1.2rem', height: '1.2rem'}} src={`/assets/icons/${setsIndex[set]}-icon.png`} alt="icon" />
)

const ObjectiveScoringOverview = ({ objectives }) => {
    return (
      <div style={{display: 'flex', flexFlow: 'row wrap'}}>
        <div style={{ order: 0}}>
          { objectives[0] > 0 && (
            <div style={{display: 'flex', flexFlow: 'row nowrap', alignItems: 'center'}}>
              <ObjectiveScoreTypeIcon type={0} style={{width: '.8rem', height: '.8rem', margin: '0 0 0 0'}} />
              <Typography style={{fontSize: '1rem'}}>{objectives[0]}</Typography>
            </div>
          )}
        </div>
        <div style={{ order: 1}}>
          { objectives[3] > 0 && (
            <div style={{display: 'flex', flexFlow: 'row nowrap', alignItems: 'center', margin: '0 0 0 .5rem'}}>
              <ObjectiveScoreTypeIcon type={3} style={{width: '.8rem', height: '.8rem', margin: '0 0 0 0'}} />
              <Typography style={{fontSize: '1rem'}}>{objectives[3]}</Typography>
            </div>
          )}
        </div>
        <div style={{ order: 2}}>
          { objectives[1] > 0 && (
            <div style={{display: 'flex', flexFlow: 'row nowrap', alignItems: 'center', margin: '0 0 0 .5rem'}}>
              <ObjectiveScoreTypeIcon type={1} style={{width: '.8rem', height: '.8rem', margin: '0 0 0 0'}} />
              <Typography style={{fontSize: '1rem'}}>{objectives[1]}</Typography>
            </div>
          )}
        </div>
        <div style={{ order: 3}}>
          { objectives[2] > 0 && (
            <div style={{display: 'flex', flexFlow: 'row nowrap', alignItems: 'center', margin: '0 0 0 .5rem'}}>
              <ObjectiveScoreTypeIcon type={2} style={{width: '.8rem', height: '.8rem', margin: '0 0 0 0'}} />
              <Typography style={{fontSize: '1rem'}}>{objectives[2]}</Typography>
            </div>
          )}
        </div>
      </div>
    );
}

const MiniSectionHeader = ({ type, children }) => (
    <div style={{borderBottom: '1px solid gray', margin: '1rem .5rem 1rem .5rem', padding: '0 0 .3rem 0', display: 'flex', alignItems: 'center'}}>
        <img src={`/assets/icons/${cardTypeIcons[type]}.png`}
            alt={cardTypeIcons[type]}
            style={{ margin: '0 .3rem 0 .5rem', width: '1.5rem', height: '1.5rem'}} />
        <div style={{ fontFamily: 'roboto', fontSize: '1.2rem', margin: '0 .3rem 0 0'}}>
            {`${cardType[type]}s`}
        </div>
        <div style={{ display: 'flex', margin: '0 0 0 0'}}>
            { children }
        </div>
    </div>
);

class Card extends PureComponent {
    state = {
        expanded: false
    }

    render() {
        const { card } = this.props;
        const animateHeight = this.state.expanded ? 'auto' : 0;

        return (
            <div>
                <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 .5rem 1rem' }}
                    onClick={this._toggleExpanded}>
                    <SetIcon id={`${card.id}`} set={card.set} />
                    <div><u>{card.name}</u></div>
                    {
                        card.glory && (
                            <div style={{ marginLeft: '.3rem'}}>({card.glory})</div>                        
                        )
                    }
                    {
                        card.scoreType >= 0 && (
                            <ObjectiveScoreTypeIcon type={card.scoreType} style={{width: '.8rem', height: '.8rem'}} />
                        )
                    }
                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '.3rem', color: 'gray', fontSize: '.7rem'}}>
                        <div>(</div>
                        { idToPrintId(card.id) }
                        <img id={idToPrintId(card.id)} alt={`wave-${card.id.substr(0,2)}`} src={`/assets/icons/wave-${card.id.substr(0,2)}-icon.png`} 
                            style={{ width: '.7rem', height: '.7rem'}} />
                        <div>)</div>
                    </div>
                </div>
                <AnimateHeight
                    height={animateHeight}
                    duration={250}
                    easing="ease-out">
                    <img className="card" src={`/assets/cards/${card.id}.png`} alt={card.id} style={{ width: '90%', margin: 'auto' }} />
                </AnimateHeight>
            </div>
        );
    }

    _toggleExpanded = () => {
        this.setState(state => ({ expanded: !state.expanded }));
    }
}

class DeckActionsMenu extends PureComponent {
    state = {
        anchorEl: null
    }

    render() {
        const { anchorEl } = this.state;

        return (
            <div style={this.props.style}>
                <IconButton style={{ backgroundColor: '#3B9979', color: 'white' }}
                    aria-owns={anchorEl ? 'actions-menu' : undefined }
                    aria-haspopup
                    onClick={this.handleClick}>
                    <MoreVerticalIcon />
                </IconButton>
                <Menu
                    id="actions-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleClose}>
                    <MenuItem onClick={this.handleExportReddit}>Save as PDF</MenuItem>
                </Menu>
            </div>

        );
    }

    handleExportReddit = () => {
        this.props.onSaveAsPdf();
    }

    handleClick = event => {
        this.setState({ anchorEl: event.currentTarget });
    }

    handleClose = () => {
        this.setState({ anchorEl: null });
    }
}

const idToPrintId = id => {
    const wavePrefix = id.substr(0, 2);
    return `${id.slice(-3)}/${totalCardsPerWave[parseInt(wavePrefix, 10)]}`;
}


class ReadonlyDeck extends PureComponent {
    render() {
        const { name, author, factionId, cards, sets, created } = this.props;
        const objectives = cards.filter(v => v.type === 0).sort((a, b) => a.name.localeCompare(b.name));
        const gambits = cards.filter(v => v.type === 1 || v.type === 3).sort((a, b) => a.name.localeCompare(b.name));
        const upgrades = cards.filter(v => v.type === 2).sort((a, b) => a.name.localeCompare(b.name));
        const spellsCount = gambits.filter(v => v.type === 3).count();
    
        const createdDate = created ? ` | ${created.toLocaleDateString()}` : '';
        const objectiveSummary = new Set(objectives).groupBy(c => c.scoreType).reduce((r, v, k) => {
            r[k] = v.count();
            return r;
        }, [0, 0, 0, 0]);
    
        return (    
            <div style={{}}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '1rem',
                }}>
                    <img id="factionDeckIcon" 
                        style={{width: '4rem', height: '4rem', margin: '0 .3rem 0 0', flex: '0 0 auto'}} 
                        alt={`${idPrefixToFaction[factionId]}`} 
                        src={`/assets/icons/${idPrefixToFaction[factionId]}-deck.png`} />
                    <div style={{flex: '1 1 auto'}}>
                        <div style={{ fontFamily: 'roboto', fontSize: '1rem', fontWeight: 'bold'}}>{name}</div>
                        <div style={{ fontFamily: 'roboto', fontSize: '.7rem', }}>{`${author}${createdDate}`}</div>
                        <div style={{margin: '.2rem 0 0 0'}}>
                            {
                                sets.sort((a, b) => a - b).map(s => <SetIcon key={s * 31}  set={s} />)
                            }
                        </div>
                    </div>
                    <DeckActionsMenu onSaveAsPdf={this._handleSaveAsPdf} />
                </div>
    
                <MiniSectionHeader type={0}>
                    (<ObjectiveScoringOverview objectives={objectiveSummary} />)
                </MiniSectionHeader>
                { 
                    objectives.toJS().map((v, i) => <Card key={i} card={v} /> )//getReadOnlyWUCardByIdFromDb(v.id, v.id.slice(-3), v, i % 2 === 0))
                }
                <div style={{borderBottom: '1px solid gray', margin: '1rem .5rem 1rem .5rem', padding: '0 0 .3rem 0', display: 'flex', alignItems: 'center'}}>
                    <img src={`/assets/icons/${cardTypeIcons[1]}.png`}
                        alt={cardTypeIcons[1]}
                        style={{ margin: '0 0 0 .5rem', width: '1.5rem', height: '1.5rem'}} />
                    {
                        spellsCount > 0 && (
                            <img src={`/assets/icons/${cardTypeIcons[3]}.png`}
                                alt={cardTypeIcons[3]}
                            style={{ margin: '0 .3rem 0 .3rem', width: '1.5rem', height: '1.5rem'}} />
                        )                    
                    }
                    <div style={{ fontFamily: 'roboto', fontSize: '1.2rem', margin: '0 .3rem 0 .3rem'}}>
                        {`Gambits`}
                    </div>
                </div>
                {
                    gambits.toJS().map((v, i) => <Card key={i} card={v} /> )//getReadOnlyWUCardByIdFromDb(v.id, v.id.slice(-3), v, i % 2 === 0))
                }
                <MiniSectionHeader type={2} />
                {
                    upgrades.toJS().map((v, i) => <Card key={i} card={v} /> )//getReadOnlyWUCardByIdFromDb(v.id, v.id.slice(-3), v, i % 2 === 0))
                }
                {/* for pdf export */}
                <div id="pdf-export-elements" style={{ position: 'fixed', left: 50000, top: 0, zIndex: 100}}>
                    <img id="factionDeckIcon" src={`/assets/icons/${idPrefixToFaction[factionId]}-deck.png`} alt="factionDeckIcon" />
                    <img id="wave-01" src={`/assets/icons/wave-01-icon.png`} alt="wave-01" />
                    <img id="wave-02" src={`/assets/icons/wave-02-icon.png`} alt="wave-02" />
                    <img id="wave-03" src={`/assets/icons/wave-03-icon.png`} alt="wave-03" />
                    <div id="textMeasureContainer" style={{ display: 'inline-flex', backgroundColor: 'magenta', flexFlow: 'column', width: 'auto'}}>
                        {
                            cards.map(c => {
                                return <div key={`card-${c.id}`} style={{ fontFamily: 'Helvetica', fontSize: '.5rem', width: 'auto'}} id={`card-${c.id}`}>{c.type === 0 ? ` - ${c.name} (${c.glory})` : `- ${c.name}`}</div>
                            })
                            
                        }
                    </div>
                    <div id="cardNumberMeasurer" style={{ display: 'inline-flex', backgroundColor: 'magenta', flexFlow: 'column', fontFamily: 'Helvetica', fontSize: '.5rem'}}>
                        000/000
                    </div>
                </div>
            </div>

        );        
    }

    _handleSaveAsPdf = () => {
        const { name, author, created, cards } = this.props;
        const objectives = cards.filter(v => v.type === 0).sort((a, b) => a.name.localeCompare(b.name));
        const gambits = cards.filter(v => v.type === 1 || v.type === 3).sort((a, b) => a.name.localeCompare(b.name));
        const upgrades = cards.filter(v => v.type === 2).sort((a, b) => a.name.localeCompare(b.name));

        let doc = new jsPDF({
            unit: 'px'
        });

        let docX = 10;
        let docY = 10;
        const rem = 16;
        doc.addImage(document.getElementById('factionDeckIcon'), 'png', docX, docY, rem * 1.5, rem * 1.5, '', 'SLOW');
        
        // Header
        docX = docX + rem * 2;
        docY = docY + 10;
        doc.setFont('Helvetica', '');
        doc.setFontSize(rem);
        doc.text(name, docX, docY);
        doc.setFontSize(rem * .5);
        docY = docY + (rem * .5);
        doc.setTextColor('#BCBDC0');
        doc.text(`${author} ${created ? ` | ${created.toLocaleDateString()}` : ''}`, docX, docY);

        let coords = this.addToPdf(doc, 'Objectives (12):', objectives, docX, docY, rem);
        coords = this.addToPdf(doc, `Gambits (${gambits.count()}):`, gambits, coords.x, coords.y, rem);
        this.addToPdf(doc, `Upgrades (${upgrades.count()}):`, upgrades, coords.x, coords.y, rem);

        doc.save(`${name}.pdf`);
    }

    addToPdf = (doc, header, cards, docX, docY, rem) => {
        docX = 10;
        docY = docY + rem * 2;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(rem * .8);
        doc.setTextColor('black');
        doc.text(header, docX, docY);
        
        docX = 10;
        docY = docY + rem *.5;
        doc.setFont('Helvetica', '');
        doc.setFontSize(rem * .6);
        doc.setTextColor('black');
        for(let card of cards) {
            doc.addImage(document.getElementById(card.id), 'png', docX, docY - 2, 8, 8)
            const text = card.hasOwnProperty('glory') ? ` - ${card.name} (${card.glory})` : ` - ${card.name}`;
            doc.text(text, docX + 10, docY + 5);
            doc.setTextColor('#BCBDC0');
            const measuredWidth = document.getElementById(`textMeasureContainer`).clientWidth;
            doc.text(`${idToPrintId(card.id)}`, docX + 10 + measuredWidth, docY + 5);
            const otherMeasuredWidth = document.getElementById(`cardNumberMeasurer`).clientWidth;
            doc.addImage(document.getElementById(`wave-${card.id.substr(0, 2)}`), 'png', docX + 10 + measuredWidth + otherMeasuredWidth, docY - 2, 8, 8);
            docY += 10;
            doc.setTextColor('black');
        }

        const coords = { x: docX, y: docY };
        return coords;
    }
}

export default ReadonlyDeck;