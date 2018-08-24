import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import ButtonBase from '@material-ui/core/ButtonBase';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AddIcon from '@material-ui/icons/Add';
import AnimateHeight from 'react-animate-height';
import "./WUCard.css";
import { cardType, cardSet } from '../data/index';


const styles = theme => ({
    expand: {
        transform: 'rotate(0deg)',
        transition: theme.transitions.create('transform', {
          duration: theme.transitions.duration.shortest,
        }),
        marginLeft: 'auto',
      },

    expandOpen: {
        transform: 'rotate(180deg)',
    },

    addButton: {
        position: 'absolute', 
        top: '1rem', 
        right: '0px', 
        width: "2rem", 
        height:'2rem', 
        borderRadius:'1rem',
        color: 'white'
    },

    inTheDeck: {
        transform: 'rotate(0deg)',
        transition: theme.transitions.create('transform', {
          duration: theme.transitions.duration.shortest,
        }),
        backgroundColor: '#3B9979',
    },

    notInTheDeck: {
        backgroundColor: '#8A1C1C',
        transform: 'rotate(45deg)',
    }
});

const colorsTable = [
    '#3E5E5F',
    // '#581F19',
    // '#181D57',
    '#321B3F',
    '#38461A',
    '#985519',
    '#61411A',
    '#1A3965',
    '#8A1C1C'
]

class WUCard extends Component {
    state = { expanded: false, color: 0, inDeck: false };

    handleExpandClick = () => {
        this.setState(state => ({ expanded: !state.expanded, color: state.color + 1 === colorsTable.length ? 0 : state.color + 1 }));
    };

    handleAddToTheDeckClick = () => {
        this.setState(state => ({inDeck: !state.inDeck}))
    }

    render() {
        const { classes } = this.props;
        const height = this.state.expanded ? 'auto' : 0;
        const icons = ['objective-icon', 'ploy-icon', 'upgrade-icon'];    
        return (
            <div className={`root ${this.props.isAlter ? 'alternateRootColor' : ''}`}>
                <div className="header">
                    <div style={{position: 'relative'}}>
                        <Avatar className="typeicon headerItem" src={`/assets/icons/${icons[this.props.type]}.png`} />
                        <ButtonBase className={classnames(classes.addButton, classes.inTheDeck, {[classes.notInTheDeck]: this.state.inDeck})} 
                                    style={{ border:`.1rem solid ${this.props.isAlter ? '#E0F3EC' : 'white'}` }}
                                    onClick={this.handleAddToTheDeckClick}>
                            <AddIcon style={{width: '1.2rem'}} />
                        </ButtonBase>
                    </div>
                    <div className="headerText headerItem">
                        <Typography variant="body2" style={{color: colorsTable[this.props.set]}}>{this.props.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                            {`${cardType[this.props.type]} | ${cardSet[this.props.set]} | ${this.props.cardPN}/437`}
                        </Typography>
                    </div>
                    <IconButton
                        className={classnames(classes.expand, {[classes.expandOpen]: this.state.expanded, })}
                        onClick={this.handleExpandClick}>
                        <ExpandMoreIcon />
                    </IconButton>
                </div>
                <AnimateHeight 
                    duration={ 175 }
                    height={ height } // see props documentation bellow
                    >
                    <img className="cardImg" alt={this.props.cardN} src={`assets/cards/${this.props.id}.png`} />
                    {/* <Image 
                        style={{ marginBottom: 10 }}
                        src={`assets/cards/${this.props.img}`} 
                        responsive /> */}
                </AnimateHeight>
                <div className="actionRow">
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(WUCard);
