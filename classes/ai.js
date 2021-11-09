'use strict'

const internal = {};

var response, response_dm, core, config, client, msg, bypass;

module.exports = internal.ai = class{
    constructor(core, config, client)
    {
        this.response       = require('../lang/responses.json');
        this.response_dm    = this.response; //require('../lang/responses_dm.json');
        this.core           = core;
        this.config         = config;
        this.client         = client;
    }
    
    findmention()
    {
        var phrase = this.phrase;
        var config = this.config;
        
        if( phrase.indexOf('»') > -1 )
        {
            var tmp = phrase.split('»');
            phrase = tmp[1].trim();
        }

        phrase = phrase.replace(/[^0-9a-z ]+/gi, '');
        this.phrase = phrase; //bring it back just in case
		
        if( phrase.indexOf(config.baylee_trigger) > -1 )
        {
            phrase = phrase.replace(' u ', ' you ')
                           .replace(' ur ', ' your ')
                           .replace(' r ', ' are ');
                                 
            var phraseArray   = phrase.split(' ');
            var lastword      = phraseArray[phraseArray.length - 1];
            var firstword     = phraseArray[0];
            var firstphrase   = phraseArray[0] + ' ' + phraseArray[1];
            
            if( lastword == config.baylee_trigger || firstword == config.baylee_trigger || firstphrase == 'hey ' + config.baylee_trigger )
            {
              phrase = phrase.trim();
              
              //var re = new RegExp('hey ' + config.baylee_trigger, 'ig');
              //phrase = phrase.replace(re, '');
              
              var re = new RegExp(config.baylee_trigger, 'ig');
              phrase = phrase.replace(re, '');
              
              return phrase;
            }
        }
        else
        {
            return false;
        }
    }
    
    async madlib(content, response)
    {
        var definitions, focus, needle, word, regex, response, re;
        
        definitions = response.definitions[0];
        
        for(var key in definitions)
        {
          focus   = response.definitions[0][key];
          
          needle  = '%'+key+'%';
          word    = focus[Math.floor(Math.random() * focus.length)];
          re = new RegExp(needle, 'ig');
          content = content.replace(re, word);
        }
        
        return content;
    }
    
    async findtriggers(dm = false)
    {
		var msg         = this.msg;
        var phrase      = this.phrase;
        var default_id, matched_id, matched, reply, focus, finder, trigger, search, mention;
        
        /* Remove hard mentions from phrase */
        mention = phrase.substring(
            phrase.lastIndexOf('<@!') + 3, 
            phrase.lastIndexOf('>')
        ) + '';
        
        phrase = phrase.replace('<@!'+mention+'>', '');
        /* end hard mention */
        
        response    = this.response;
        if(dm) response = this.response_dm;
        client      = this.client;
        config      = this.config;
        matched     = ' ';
      
        for(var category in response)
        {
            //exclude the definitions
            if( category != 'definitions' )
            {
                //try to match a trigger
                trigger = response[category][0].trigger;
                
                console.log(phrase);
                
                search  = trigger.forEach(await function (needle)
                                          {
                                              finder = phrase.search(needle);
                                              
                                              if( needle == 'default' ) default_id = category;
                                              
                                              if( finder > -1 && needle.length > matched.length )
                                              {
                                                  matched_id  = category;
                                                  matched     = needle;
                                              }
                                          });
                
            }
        }
        
        if( matched_id )
        {
           focus     = response[matched_id][0].reply;
           
        }
        else { focus = response[default_id][0].reply;
        }
        
        reply     = focus[Math.floor(Math.random() * focus.length)];
        reply     = await this.madlib(reply, response);
        
        msg.channel.startTyping(1);
          client.setTimeout(function() {
          msg.channel.sendMessage(reply)
          .then(function()
                {
                    msg.channel.stopTyping(true);
                });
          }, 2000);
          
          if( this.bypass ) //log the dm to the messages channel
          { 
            //client.channels.get(config.chatid_baylee_messages).send('**From** @' + msg.author.tag + '\n\n» *Message*: ' + msg + '\n» *Response*: ' + reply + '\n ▬▬▬▬▬▬▬▬▬▬');
          }
          
        return reply;
          
    }
    
    handler(msg, bypass = false)
    {
      this.bypass   = bypass;
      this.msg      = msg;
      this.phrase   = msg.content.toLowerCase();
      
      if(bypass)
      {
        this.findtriggers(true);
        return true;
      }
      else
      {
        var mention = this.findmention();
        if( mention )
        {
          this.findtriggers();
          return true;
        }
      }
    }
}