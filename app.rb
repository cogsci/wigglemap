require 'rubygems'
require 'sinatra'

get '/some_api_call' do
    # some json response
end

get '/' do
    erb :index
end

