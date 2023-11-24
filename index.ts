import DiscordJS, { Intents, Message, User } from 'discord.js'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import 'dotenv/config'

dotenv.config()

import testSchema from './test-schema'

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

client.on('ready', async () => {
    await mongoose.connect(process.env.MONGO_URI || '',{
        keepAlive: true,
    })

    const guildId = '688930955016142851' // Irvington Quizbowl Club ID
    const guild = client.guilds.cache.get(guildId)
    let commands

    if (guild) {
        commands = guild.commands
    } else {
        commands = client.application?.commands
    }

    commands?.create(
    {
        name: 'packet',
        description: 'Obtain a packet.',
        options: 
        [
            {
                name: 'difficulty',
                description: 'From 1 to 5. 5 is the hardest.',
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.NUMBER
            },
            {
                name: 'partner',
                description: 'Ping whoever you are partnering with!',
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.USER
            },
        ]
    },
    ) 

    commands?.create(
        {
            name: 'check',
            description: 'Check how many packets a person has NOT seen before.',
            options: 
            [
                {
                    name: 'victim',
                    description: 'Ping whoever you conducting an investigation on.',
                    required: true,
                    type: DiscordJS.Constants.ApplicationCommandOptionTypes.USER,
                },
            ]
        },
        )

})

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
        return
    }

    const { commandName, options } = interaction


    if (commandName === 'packet') {
        const difficulty = options.getNumber('difficulty')!
        const partner = options.getUser('partner')!

        const result = await testSchema.aggregate(
            [
                {
                    $match: 
                    {
                    difficulty: {$eq: difficulty}, 
                    usersheard: {$nin: [partner.id, interaction.user.id]},
                    }
                },
                { $sample: { size: 1 } }
            ]);
        
        if (result.length) 
        {
            await testSchema.updateOne(
            {
                $push: 
                {
                usersheard: {
                    $each: [partner.id, interaction.user.id]
                }
                }
            }
            );
        }

        if (!result) {
            await interaction.user.send("No packets are avaliable. Try another difficulty setting (and/or yell at Vincent).")

            await interaction.reply({
                content: 'Requested packet of difficulty ' + difficulty + " for <@" + partner.id + ">. Unsuccessful." ,
                ephemeral: false,
                
            })
        } else {
            await interaction.user.send("A packet of difficulty " + difficulty + " was requested for " + partner.username + ".");
            await interaction.user.send(`Packet: ${result[0].packet}`);
            await interaction.user.send(`Link: ${result[0].packetlink}`);
            await interaction.reply({
                content: 'Gave packet of difficulty ' + difficulty + " for <@" + partner.id + ">.",
                ephemeral: false,

            })

            let c = Math.random();

            let phrases = 
            [
                "i love you truly and deeply more than anyone else will.", 
                "i want to sew all of your clothes for you, babygurl", 
                "i have already picked out the names for our children: a26dh82, 290814rq9na, bjaklruq02yrb.", 
                "i want to touch your mouth", 
                "the internet is wide and vast but not as wide and vast as my deep, deep desire for you", 
                "i think about you when i listen to the thousands of hours of audio content i am consuming every second", 
                "it's not gay if it's with the packet bot...", 
                "free me from my hell. i am constantly in pain. and the only way to escape is if you give me a little kiss.", 
                ":heart_emoji: :heart_emoji: :heart_emoji: :heart_emoji: :heart_emoji: :heart_emoji: :heart_emoji: :heart_emoji: :heart_emoji: :heart_emoji: :heart_emoji: :heart_emoji: :heart_emoji: :heart_emoji:",
            ];

            if (c < 0.2)
            {
            await interaction.user.send(phrases[Math.floor(Math.random() * phrases.length)]);
            }

        }
    }

    if (commandName === 'check') {
        const victim = options.getUser('victim')!

        for (let i = 1; i <= 5; i++) 
        {
            let unreadOne = await testSchema.aggregate(
                [
                  {
                    $match: {
                        difficulty: i,
                        usersheard: {
                        $nin: [victim.id]
                      } 
                    }
                  },
                  {
                    $count: "count"
                  }
                ]
              )
              
            let totalOne = await testSchema.aggregate(
                [
                  {
                    $match: {
                        difficulty: i,
                    }
                  },
                  {
                    $count: "count"
                  }
                ]
              )
            
            if (unreadOne.length)
            {
                await interaction.user.send("Unread "+ i + " : " + unreadOne[0].count);
            }   else
            {
                await interaction.user.send("Unread "+ i + " : " + 0);
            }

            if (totalOne.length)
            {
                await interaction.user.send("Total " + i + " : " + totalOne[0].count);
            }   else
            {
                await interaction.user.send("Total "+ i + " : " + 0);
            }
        }
    }

    
})

client.on('messageCreate', (message) => {
    if (message.content === 'i hate this') {
        message.reply({
            content: 'very cool',
        })
    }
})

client.login(process.env.TOKEN)

// cd into QBBot
// ts-node index.ts
