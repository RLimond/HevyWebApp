const mongoose = require('mongoose');
const exerciseSchema = new mongoose.Schema({
    id: String,
    title: String,
    es_title: String,
    de_title: String,
    fr_title: String,
    it_title: String,
    pt_title: String,
    ko_title: String,
    ja_title: String,
    tr_title: String,
    ru_title: String,
    zh_cn_title: String,
    zh_tw_title: String,
    superset_id: String,
    rest_seconds: Number,
    notes: String,
    exercise_template_id: String,
    url: String,
    exercise_type: String,
    equipment_category: String,
    media_type: String,
    custom_exercise_image_url: String,
    custom_exercise_image_thumbnail_url: String,
    thumbnail_url: String,
    muscle_group: String,
    other_muscles: [String],
    priority: Number,
    sets: [{
        id: Number,
        index: Number,
        indicator: String,
        weight_kg: Number,
        reps: Number,
        distance_meters: Number,
        duration_seconds: Number,
        rpe: Number,
        prs: [{ type: {type: String}, value: Number }],
        personalRecords: [{ type: {type: String}, value: Number }]
    }]
});

const workoutSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true
      },
      //id: String,
      short_id: String,
      index: Number,
      name: String,
      description: String,
      start_time: Number,
      end_time: Number,
      created_at: Date,
      updated_at: Date,
      routine_id: String,
      apple_watch: Boolean,
      user_id: String,
      username: String,
      profile_image: String,
      verified: Boolean,
      nth_workout: Number,
      like_count: Number,
      is_liked_by_user: Boolean,
      like_images: [String],
      comments: [String],
      comment_count: Number,
      media: [String],
      image_urls: [String],
      exercises: [exerciseSchema]

});

const friendRequestSchema = new mongoose.Schema({ 
    requesterRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Reference the FriendRequest model
    },
    requester: String,
    requesterId: String,
    requesterPic: String,
    recipientId: String,
    recipient: String,
    recipientPic: String,
    status: {
        type: Number,
        enums: [
            0,    //'add friend',
            1,    //'requested',
            2,    //'pending',
            3,    //'friends'
        ]
      },
    following: { // requester is following recipient
        type: Number,
        enums: [
            0,    //'following',
            1,    //'requested',
            3     //'rejected, can send again'
      ]
    },
    follower: { // recipient is a follower of the requester
      type: Number,
      enums: [
          0,    //'following',
          1,    //'requested',
          3,    //'rejected, can send again'
    ]
  } // Recipient is a follower of the requester
  })

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true
      },
    password: String,
    username: String,
    email: String,
    profile_pic: String,
    friends: {
        type: [friendRequestSchema], // Array of friends/follower/following
        default: [] // Initial empty friends list
      },
    numFollowers: Number,
    numFollowing: Number,
    likes_push_enabled: Boolean,
    follows_push_enabled: Boolean,
    comments_push_enabled: Boolean,
    comment_mention_push_enabled: Boolean,
    comment_discussion_push_enabled: Boolean,
    private_profile: Boolean,
    follower_count: Number, //from Hevy, this site will track followers seperately
    following_count: Number, //from Hevy
    created_at: Date,
    last_workout_at: Date,
    comment_replies_push_enabled: Boolean,
    accepted_terms_and_conditions: Boolean,
    is_coached: Boolean,
    workouts: [workoutSchema]
  });

module.exports = {exerciseSchema, workoutSchema, userSchema, friendRequestSchema};