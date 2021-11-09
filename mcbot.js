const Discord   = require('discord.js');
const request   = require('request');
const fs        = require('fs');

var config          = require('./config.json');
const class_ai      = require('./classes/ai.js');

const client  = new Discord.Client();
const ai      = new class_ai('core', config, client);


var pSetting = {};
var pConversation = {};
var embedColors = { 'colors': [ 'd905ff', '33ffff', '00ffa2', 'ffc600', 'ff4200', 'a142f4' ]};

  function sendCanned(filename, chat_id, client)
  {
    fs.readFile('canned/'+filename+'.txt', 'utf8', function(err, contents) {
            client.channels.get(chat_id).send(contents)
    });
  }

	function delayedchat(msg, message, delay, chain = false)
	{
    client.channels.get(msg.channel.id).startTyping(1);
	  client.setTimeout(function() {
      client.channels.get(msg.channel.id).sendMessage(message)
      .then(function()
            {
              if( chain == false ) client.channels.get(msg.channel.id).stopTyping(true);
              if( chain == true )
              {
                  client.channels.get(msg.channel.id).stopTyping(true);
                  client.channels.get(msg.channel.id).startTyping(true);
              }
            });;
	  }, delay);
	}

	function delayedmessage(msg, message, delay, chain = false) 
	{
    msg.channel.startTyping(1);
	  client.setTimeout(function() {
      msg.author.sendMessage(message)
      .then(function()
            {
              if( chain == false ) msg.channel.stopTyping(true);
              if( chain == true )
              {
                  msg.channel.stopTyping(true);
                  msg.channel.startTyping(true);
              }
            });;
	  }, delay);
	}
  
  function staff_clear_server(msg)
  {
    pSetting[msg.author.id] = { 'server': '' };
  }

	function staff_set_server(msg, topic)
	{
    pSetting[msg.author.id] = { 'server': topic };
	}
  
	function staff_get_server(msg)
	{
      if( pSetting[msg.author.id] == undefined )
      {
        return false;
      } else {
        return pSetting[msg.author.id]['server'];
      }
  }
  
  function clear_conversation(msg)
  {
    pConversation[msg.author.id] = { 'conversation': '', 'toggle': '', 'callback': '' };
  }

	function set_conversation(msg, topic)
	{
    pConversation[msg.author.id]['conversation'] = topic;
	}
  
	function get_conversation(msg)
	{
      if( pConversation[msg.author.id] == undefined )
      {
        return false;
      } else {
        return pConversation[msg.author.id]['conversation'];
      }
	}
  
	function get_toggle(msg)
	{
      if( pConversation[msg.author.id] == undefined )
      {
        return false;
      } else {
        return pConversation[msg.author.id]['toggle'];
      }
	}
  
	function get_callback(msg)
	{
      if( pConversation[msg.author.id] == undefined )
      {
        return false;
      } else {
        return pConversation[msg.author.id]['callback'];
      }
	}
  
	function set_toggle (msg, toggle)
	{
    pConversation[msg.author.id]['toggle'] = toggle;
	}
  
	function set_callback (msg, toggle)
	{
    pConversation[msg.author.id]['callback'] = toggle;
	}
  

function isempty(v)
{
  if( typeof v === 'undefined' )
  {
    return true;
  }
  
  return false;
}

function update()
{
  request('http://domain.com/stats/players.php', function(err, response, body)
  {
      body = JSON.parse(body);
      var status = ' a restarting server';
      
      if(body.players)
      {
          var playercount = 0;
          if(body.players) playercount = body.players.count;
          status = playercount + ' players online'
          
          client.channels.get("662075934613962763").setName('👉 ' + status)
          .catch(console.error);
      }
      
      client.user.setActivity(status, { type: 'WATCHING' })
      .then(presence => status)
      .catch(console.error);
  }); //end request
}

client.on('ready', () => {
  console.log('Baylee is up and online');
  update(); //set inital update
  client.setInterval(update,10 * 1000);
});

client.on('guildMemberAdd', member => {

    fs.readFile('canned/new-player.txt', 'utf8', function(err, contents) {
            member.user.sendMessage(contents)
    });
});

client.on('channelCreate', async channel => {
  chanName = channel.name + '';
  chanID = channel.id;
  
  if( chanName.substring(0, 7) == 'ticket-' )
  {
    setTimeout(sendCanned('ticket-welcome', chanID, client), 1000);
  }
});

client.on('message', (msg) =>
{
    client.emit('checkMessage', msg);
    
    if( msg.author.id == '573121606742835200' ) return;
    //Mention check
    if (msg.isMentioned(client.user))
    {
      ai.handler(msg,  true);
    } else {
      handleChat(msg);
    }
});

function handleChat(msg)
{
  if( msg.guild )
  {
    if( msg.channel.id == config.chatid_baylee_research )
    {
      
      convInfo = get_conversation(msg);
  
      if( !isempty(convInfo) )
      {      
        switch( convInfo )
        {
          case 'poll':
          case 'news':
          case 'event':
          case 'channel':
            response 	= String(msg.content);
            chatmsg   = response;
            response 	= response.toLowerCase();
            
            toggle    = get_toggle(msg);
            callback  = get_callback(msg);
            
            
            if(response == 'stop' || response == 'cancel')
            {
              clear_conversation(msg);
              delayedchat(msg, 'Alright, I canceled it', 500);
            }
            else
            {
              if( toggle == 'headline' )
              {
                var color = embedColors.colors[Math.floor(Math.random() * embedColors.colors.length)];
    
                newspost = new Discord.RichEmbed()
                  .setColor('#' + color)
                  
                  .setDescription(chatmsg);
                  
                  switch( convInfo )
                  {
                    case 'channel':
                      
                      strURLChk = chatmsg.substring(0, 7);
                      
                      if( strURLChk == 'https:/' || strURLChk == 'http://' )
                      {
                        msgImg = new Discord.RichEmbed().setImage(chatmsg);
                        client.channels.get(callback).send(msgImg);
                      } else {
                        client.channels.get(callback).send(newspost);
                      }
                      break;
                    
                    case 'event':
                      client.channels.get(config.chatid_events).send('Event: **' + callback + '**\n\nPosted by: ' + msg.author.toString() + '\nNotification: @here\n\n▫️▫️▫️▫️▫️▫️');
                      client.channels.get(config.chatid_events).send(chatmsg).then(function(message) {
                        message.react("👍");
                      });
                      break;
                    
                    case 'poll':
                      client.channels.get(config.chatid_news).send('New Poll: **' + callback + '**\n\nPosted by: ' + msg.author.toString() + '\nNotification: @here\n\n▫️▫️▫️▫️▫️▫️');
                      client.channels.get(config.chatid_news).send(chatmsg).then(function(message) {
                        message.react("👍");
                        message.react("👎");
                      });;
                      break;
                    
                    case 'news':
                    default:
                      client.channels.get(config.chatid_news).send('**' + callback + '**\n\nPosted by: ' + msg.author.toString() + '\nNotification: @here\n\n▫️▫️▫️▫️▫️▫️');
                      client.channels.get(config.chatid_news).send(chatmsg);
                      break;
                  }
    
                delayedchat(msg, 'Perfect, I posted it', 500);
                clear_conversation(msg);
              }
              else
              {
                switch( convInfo )
                {
                  case 'channel':
                      mention = response.substring(
                          response.lastIndexOf('<#') + 2, 
                          response.lastIndexOf('>')
                      );
                      
                    if( mention.length > 10 )
                    {
                      set_toggle(msg, 'headline');
                      set_callback(msg, mention);
                      
                      delayedchat(msg, 'Alright, tell me the message you want to post', 500);
                    }
                    else
                    {
                      delayedchat(msg, 'Sorry, you have to __tag__ a channel to post in', 500);
                    }
                    break;
                  
                  case 'poll':
                    set_toggle(msg, 'headline');
                    set_callback(msg, chatmsg);
                    
                    delayedchat(msg, 'Okay, tell me the message for the poll', 500);
                    break;
  
                  default:
                    set_toggle(msg, 'headline');
                    set_callback(msg, chatmsg);
                    
                    delayedchat(msg, 'Alright, tell me the message you want to post', 500);
                    break;
                }
              }
            }
        }
      }
      
    }
  
    //Start command parser
    phrases = msg.content.toLowerCase();
    
    nmsg = phrases.split(' ');
    const [keyword, ...args] = nmsg;
    
    switch(phrases)
    {      
      case '!colors':
        var color = embedColors.colors[Math.floor(Math.random() * embedColors.colors.length)];
        
        colorsEmbed = new Discord.RichEmbed()
        .setColor('#' + color)
        .setURL('https://domain.com/')
        .addField('Color codes', '<:cred:662089460498038814> Red **§c**\n<:credd:662089460586119198> Dark Red **§4**\n<:cgold:662089460393050122> Gold **§6**\n<:cgoldyellow:662089460388855838> Yellow **§e**\n<:cgreend:662089460149911554> Dark Green **§2**\n<:cgreen:662090097033871360> Green **§a**\n<:caqua:662089460284129321> Aqua **§b**\n<:caquad:662089459919224878> Dark Aqua **§3**\n', true)
        .addField('Color codes', '<:cblue:662089460011368487> Dark Blue **§1**\n<:cblueindigo:662089459923288095> Indigo **§9**\n<:cpink:662089461118533662> Pink **§d**\n<:cpinkpurp:662089460392919072> Purple **§5**\n<:cwhite:662089460569210909> White **§f**\n<:cgray:662089460460290090> Gray **§7**\n<:cgrayd:662089460392919040> Dark Gray **§8**\n<:cblack:662089460288323634> Black **§0**',  true)
        .addField('Formatting', '<:cfstrike:662089460372078599> Strikethrough **§m**\n<:cfunderline:662089460057374742> Underline **§n**\n<:cfbold:662089460334329885> Bold **§l**', true)
        .addField('Formatting', '<:cfitalic:662089459990528031> Italic **§o**\n<:cfmagic:662089460338655252> Magic **§k**', true)
        
        msg.channel.send(colorsEmbed);
      return;
      break;    
    }
  
    
    //madlib engine
    ai.handler(msg);
    
    switch(keyword)
    {
      case 'post':
        if( msg.channel.id == config.chatid_baylee_research )
        {
          clear_conversation(msg); //init conversation
          switch( args[0] )
          {
            case 'channel':
              if( msg.member.hasPermissions("VIEW_AUDIT_LOG") )
              {
                set_conversation(msg, 'channel');
                set_callback(msg, '');
                delayedchat(msg, '[**Channel Post**] Tag the channel you want to post in', 500);
              }
              return;
              break;
            
            case 'news':
              if( msg.member.hasPermissions("VIEW_AUDIT_LOG") )
              {
                set_conversation(msg, 'news');
                set_callback(msg, '');
                delayedchat(msg, '[**News Post**] What\'s the headline for this post?', 500);
              }
              return;
              break;
            
            case 'poll':
              if( msg.member.hasPermissions("VIEW_AUDIT_LOG") )
              {
                set_conversation(msg, 'poll');
                set_callback(msg, '');
                delayedchat(msg, '[**Server Poll**] What\'s the title of this poll?', 500);
              }
              return;
              break;
            
            case 'event':
              if( msg.member.hasPermissions("VIEW_AUDIT_LOG") )
              {
                set_conversation(msg, 'event');
                set_callback(msg, '');
                delayedchat(msg, '[**Event Post**] Title example: **May 17th - UFO Invasion**', 500, true);
                delayedchat(msg, 'What would you like the event title do be?', 1000);
              }
              return;
              break;
          }
        }
        return;
        break;
    }
    
    //send to baylee messages if i can't process the DM
    //console.log( ai.handler(msg,  true) );
  }
}

client.login(config.token);