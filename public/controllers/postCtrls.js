/*
 * POST CONTROLLERS
 */

'use strict';

angular.module('myApp')
  .controller('PostIndexCtrl', function ($scope, Post, Socket, $routeParams, $cookies) {
    $scope.room_name = "#" + $routeParams.room_name

    // GET POSTS
    $scope.posts = Post.query({ "room_name": $routeParams.room_name });

    $scope.post = { "room_name": $routeParams.room_name };

    // PUBLISH POST
    $scope.$on('socket:broadcast.post', function (event, post) {
      if (post.room_name == $routeParams.room_name) {
        $scope.$apply(function() {
          $scope.posts.unshift(post);
          $scope.post.body = ''          
        });
      };
    });

    $scope.alreadyVoted =  function(post, direction){
      if (direction === 'up') {
        return $scope.vup_ids.indexOf(post._id) > -1  
      } else if (direction === 'down') {
        return $scope.vdp_ids.indexOf(post._id) > -1
      }
    }

    $scope.publishPost = function () {
      console.log($scope.post)
      Socket.emit('publish.post', $scope.post);
    };


    if (!$cookies.vup_ids) {
      $scope.vup_ids = [];
    } else {
      $scope.vup_ids = JSON.parse($cookies.vup_ids);
    }

    if (!$cookies.vdp_ids) {
      $scope.vdp_ids = [];
    } else {
      $scope.vdp_ids = JSON.parse($cookies.vdp_ids);
    }

    // click vote up
    // if already voted up, return nil
    // else emit vote_up.post
    // on response 
    // if already voted down, remove from vdp_ids
    // else add to vup_ids

    // VOTE UP
    $scope.voteUp = function (post) {
      if ($scope.vup_ids.indexOf(post._id) > -1 ) {
        console.log('already voted up')
        console.log($scope.vup_ids)
      } else {
        Socket.emit("vote_up.post", { id: post._id });
      }
    }

    $scope.$on('socket:broadcast.vote_up', function (event, post) {
      var post = _.findWhere($scope.posts, {_id: post._id});

      if ($scope.vdp_ids.indexOf(post._id) > -1) {
        //remove from vote down ids
        $scope.vdp_ids = _.without($scope.vdp_ids, post._id);
        $cookies.vdp_ids = JSON.stringify($scope.vdp_ids);
      } else {
        // Add and save voted down ids to cookie
        $scope.vup_ids.push(post._id)
        $cookies.vup_ids = JSON.stringify($scope.vup_ids);
      }
      // INCREMENT VOTE_COUNT
      post.votes_count = ++post.votes_count
    });

    $scope.voteDown = function (post) {
      if ($scope.vdp_ids.indexOf(post._id) > -1 ) {
        console.log('already voted down')
        console.log($scope.vdp_ids)
      } else {
        Socket.emit("vote_down.post", { id: post._id });  
      }
    }

    $scope.$on('socket:broadcast.vote_down', function (event, post) {
      var post = _.findWhere($scope.posts, {_id: post._id});

      if ($scope.vup_ids.indexOf(post._id) > -1) {
        //remove from vote up ids
        $scope.vup_ids = _.without($scope.vup_ids, post._id);
        $cookies.vup_ids = JSON.stringify($scope.vup_ids);
      } else {
        $scope.vdp_ids.push(post._id)
        $cookies.vdp_ids = JSON.stringify($scope.vdp_ids);
      }
      // DECREMENT vote_count
      post.votes_count = --post.votes_count
    });


    // Socket.on('user:left', function (data) {
    //   $scope.messages.push({
    //     user: 'chatroom',
    //     text: 'User ' + data.name + ' has left.'
    //   });
    //   var i, user;
    //   for (i = 0; i < $scope.users.length; i++) {
    //     user = $scope.users[i];
    //     if (user === data.name) {
    //       $scope.users.splice(i, 1);
    //       break;
    //     }
    //   }
    // });
    
  });