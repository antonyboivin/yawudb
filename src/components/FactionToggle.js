import React, { Component } from 'react';
import ToggleImageButton from './ToggleImageButton';
import { factions, warbandsWithDefaultSet } from '../data/index';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Typography, IconButton } from '@material-ui/core';
import AnimateHeight from 'react-animate-height';
import { withStyles } from '@material-ui/core/styles';

const SelectedFaction = ({ faction, style }) => (
    <div style={{...style, ...{
        display: 'flex',
        alignItems: 'center',
        margin: '.5rem',
    }}}>
        <img alt={`${faction}`} style={{width: '3.5rem', height: '3.5rem', margin: '0 1rem 0 0rem'}} src={`/assets/icons/${faction.startsWith('n_') ? faction.slice(2) : faction}-icon.png`} />
        <Typography variant="body1">{`${faction.startsWith('n_') ? factions[faction.slice(2)] : factions[faction]}`}</Typography>
    </div>
);


class FactionToggle extends Component {
    state = {
        isExpanded: false,
        selectedFaction: this.props.selectedFaction
    }

    handleSelectFaction = (faction, defaultSet) => {
        this.setState({ selectedFaction: faction, isExpanded: false });
        
        if(this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        this.timeoutId = setTimeout(() => this.props.setFaction(faction, defaultSet), 250);
    }

    renderFactionToggleButton = (faction, defaultSet) => {
        return (
            <div key={faction} style={{display: 'flex', flexFlow: 'row wrap', alignItems: 'center'}}>
                <ToggleImageButton 
                    isOff={faction !== this.state.selectedFaction} 
                    onImage={`/assets/icons/${faction.startsWith('n_') ? faction.slice(2) : faction}-icon.png`}
                    offImage={`/assets/icons/${faction.startsWith('n_') ? faction.slice(2) : faction}-icon-bw.png`}
                    onToggle={this.handleSelectFaction.bind(this, faction, defaultSet)}
                    />
                <Typography variant="button" style={{marginLeft: '.5rem'}}>{`${faction.startsWith('n_') ? factions[faction.slice(2)] : factions[faction]}`}</Typography>
            </div>
        );
    }     

    render() {
        const { classes, editMode, style } = this.props;
        const height = this.state.isExpanded ? 'auto' : 0;
        return (
            <div className={classes.root}>
                <div style={{...style, ...{display: 'flex', marginTop: '1rem', alignItems: 'center'}}}>
                    <SelectedFaction faction={this.state.selectedFaction} style={{flex: '1 1 auto'}} />
                    {
                        !editMode && (
                            <IconButton style={{color: 'white', backgroundColor: '#3B9979'}}
                                        onClick={() => this.setState(state => ({isExpanded: !state.isExpanded}))}>
                                <ExpandMoreIcon />
                            </IconButton>
                        )
                    }
                </div>
                <AnimateHeight
                    duration={200}
                    easing="ease-out"
                    height={height}>
                    <div style={{display: 'flex', flexFlow: 'column wrap', margin: '0 0 0 1rem'}}>
                        <Typography variant="subtitle1">BEASTGRAVE</Typography>
                        { warbandsWithDefaultSet.slice(20).map(([faction, defaultSet]) => this.renderFactionToggleButton(faction, defaultSet)) }                        

                        <Typography variant="subtitle1">NIGHTVAULT</Typography>
                        { warbandsWithDefaultSet.slice(8, 18).map(([faction, defaultSet]) => this.renderFactionToggleButton(faction, defaultSet)) }                        

                        <Typography variant="subtitle1">SHADESPIRE</Typography>
                        { warbandsWithDefaultSet.slice(0, 8).map(([faction, defaultSet]) => this.renderFactionToggleButton(faction, defaultSet)) }                        

                        <Typography variant="subtitle1">DREADFANE</Typography>
                        { warbandsWithDefaultSet.slice(18, 20).map(([faction, defaultSet]) => this.renderFactionToggleButton(faction, defaultSet)) }                        
                    </div>
                </AnimateHeight>
            </div>
            
        );
    }
}

const styles = theme => ({
    root: {
        width: '98%',
        [theme.breakpoints.up('lg')] : {
            width: '49.5%'
        }
    },
});

export default withStyles(styles)(FactionToggle);