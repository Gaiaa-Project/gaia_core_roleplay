Gaia = {}

local cache = {}
local resource = 'gaia_core_roleplay'

setmetatable(Gaia, {
    __index = function(_, key)
        if cache[key] then return cache[key] end

        local fn = exports[resource][key]

        if not fn then
            error(('Gaia.%s does not exist'):format(key), 2)
        end

        cache[key] = function(...)
            return exports[resource][key](nil, ...)
        end

        return cache[key]
    end,

    __newindex = function()
        error('cannot modify the Gaia namespace', 2)
    end,
})
