require 'mongoid'

class Crime
	include Mongoid::Document
	store_in collection: "crimes"
	field :incident_num
	field :category
	field :date
	field :time
	field :pd_district
	field :address
	field :street
	field :block
	field :x
	field :y
	field :location
end
