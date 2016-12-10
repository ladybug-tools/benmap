
def open_file(fname):
    try:
        fin = open(fname, 'r')
        data = fin.readlines()
        fin.close()
        return data
    except:
        print 'File %s not opened' % fname
        return False

csvfile = "C:\\Users\\vasanthakumars\\Documents\\GitHub\\BEnMap\\resources\\Energy_Reporting_Data_Sept2016_CLEAM.csv"
lstofbld = open_file(csvfile)
properties = lstofbld.pop(0)
#print properties
        
dist2challenge_per = []
challenge_target = []
dist2challenge_val = []
countofomit = 0
general_types = []

for i,bld in enumerate(lstofbld):
    if True:#i > 4:#abs(i-5.)<0.001:
        lstofinfo = bld.split(',')
        
        #reset inputs
        mediansiteeui = None
        energy_target = None
        energy_percent_reduction = None
        type = None
        gentype = None
        eui = None
        year_built = None
        
        type = lstofinfo[2]
        #Not sure why this is happening, quick fix
        if "Yes" in type: type = lstofinfo[3]
        eui = lstofinfo[22]
        year_built = lstofinfo[10]
        
        # These are our upper categories
        #From CBECS Table C7 = 7 divisions for building types
        #Reference for gentypes: "Office","Warehouse and storage","Service","Mercantile","Education","Public assembly"
        #key terms from here: http://www.eia.gov/consumption/commercial/building-type-definitions.php
        type = type.lower()
        EducationKeys = ["elementary school", "campus","middle school","high school", "college","preschool","daycare","adult education","career","vocational training","religious education","school","college","education"]
        OfficeKeys = ["administrative","professional office","laboratory","courthouse", "government office","mixed", "mixed-use office","bank","financial","office","non-profit","social services","city hall","call center"]
        WarehouseKeys = ["refrigerated warehouse","non-refrigerated warehouse","distribution","shipping center","storage","shipping","refrigerated","parking","distribution"]
        PublicAssemblyKeys = ["recreation","fitness","community","lodge","meeting","convention","senior center","recreation","gymnasium","health club","bowling","ice rink","field house",\
        "entertainment","culture","museum","theater","cinema","sports","casino","club","public assembly","stadium","worship facility","arena","library","funeral","student center",\
        "terminal","chapels","churches","mosques","synagogues","religious","temples","movie","performing","social","rink"]
        MercentileKeys = ["mall","retail store","beer","wine","dealership","showroom","studio","gallergy","vehicle repair","repair","race"]
        ServiceKeys = ["food","grocery","convenience","restaurant","fast food"]
        ResidentialKeys = ["lodging","hotel","residence","housing","senior care","barracks","residential","multifamily","home","dormitory"]
        HealthKeys = ["outpatient","hospital","surgical","clinic","mental"]
        OtherKeys = ["other","industrial","manafacturing","casting"]
        OrderSafteyKeys = ["public order","safety","police", "station","jail","fire"]
        
        
        # Identify the building type
        settype = False
        
        # Education
        if not settype:
            for edukey in EducationKeys:
                if edukey in type:
                    gentype = "Education"
                    if "college" in type or "university" in type:
                        mediansiteeui = 244.
                    else:
                        mediansiteeui = 144.
                    #print type
                    #print gentype
                    #print mediansiteeui
                    settype = True
                    break
        # Office
        if not settype:
            for officekey in OfficeKeys:
                if officekey in type:
                    gentype = "Office"
                    mediansiteeui = 127.
                    settype = True
                    break
        # Warehouse and Storage
        if not settype:
            for warehousekey in WarehouseKeys:
                if warehousekey in type:
                    gentype = "Warehouse and Storage"
                    mediansiteeui = 28.
                    settype = True
                    break
        
        # Public Assembly
        if not settype:
            for publickey in PublicAssemblyKeys:
                if publickey in type: 
                    gentype = "Public Assembly"
                    if not settype and "entertainment" in type or "movie" in type or "performing" in type or "museum" in type:
                        mediansiteeui = 94.
                    elif not settype and "library" in type:
                        mediansiteeui = 246.
                    elif not settype and "public assembly" in type or "stadium" in type or "worship facility" in type or "arena" in type:
                        mediansiteeui = 89.
                    elif not settype and "social" in type:
                        mediansiteeui = 71.
                    elif "recreation" in type or "fitness" in type:
                        mediansiteeui = 100.
                    else:
                        mediansiteeui = 89.
                    settype = True
                    break
        
        # Mercentile
        if not settype:
            for merckey in MercentileKeys:
                if merckey in type:
                    gentype = "Mercentile"
                    if "mall" in type:
                        mediansiteeui = 247.
                    elif "vehicle repair" in type or "repair" in type:
                        mediansiteeui = 96.
                    else:
                        mediansiteeui = 139.
                    settype = True
                    break
            
        # Service
        if not settype:
            for servicekey in ServiceKeys:
                if servicekey in type:
                    gentype = "Service"
                    if "food sales" in type or "grocery" in type:
                        mediansiteeui = 570.
                    elif "convenience" in type:
                        mediansiteeui = 657. 
                    elif "restaurant" in type:
                        mediansiteeui = 434.
                    elif "fast food" in type:
                        mediansiteeui = 1170.
                    else:
                        mediansiteeui = 575.
                    settype = True
                    break
        
        # Residential
        if not settype:
            for reskey in ResidentialKeys:
                if reskey in type:
                    gentype = "Residential"
                    mediansiteeui = 163.
                    settype = True
                    break
        
        # Health
        if not settype:
            for healthkey in HealthKeys:
                if healthkey in type:
                    gentype = "Health"
                    if "outpatient" in type or "hospital" in type or "surgical" in type:
                        mediansiteeui = 163.
                    else:#"clinic" or "mental":
                        mediansiteeui = 194.
                    settype = True
                    break
        
        # Other
        if not settype:
            for otherkey in OtherKeys:
                if otherkey in type:
                    gentype = "Other"
                    mediansiteeui = 127.
                    settype = True
                    break
        
        
        #Public Order and Safety
        if not settype:
            for orderkey in OrderSafteyKeys:
                if orderkey in type:
                    if not settype and "public order" in type or "safety" in type:
                        mediansiteeui = 161.
                    else:# not settype and "police station" in type or "fire" in type:
                        mediansiteeui = 146.
                    gentype = "Public Order and Saftey"
                    settype = True
                    break

        if not settype:
            mediansiteeui = 127.
            #print 'NO ID'
            gentype = "Unknown"
            #print 'school' in type
            #print '--'
            countofomit += 1.
        #print '--'
        #print i, type
        #print lstofinfo
        #print 'median', mediansiteeui
        #print 'energy', eui
        #print 'year', year_built
        
        
        
        try:
            mediansiteeui = float(mediansiteeui)
            #http://architecture2030.org/about/timeline/ 
            #architecture 2030 launched in 2002
            year_built = int(year_built)
            eui = float(eui)
            #print 'median', mediansiteeui
            if year_built < 2002:
                energy_target = float(mediansiteeui) * 0.8
                energy_percent_reduction = 1. - (energy_target/eui)
                val_energy_red = eui - energy_target
                #energy_percent_reduction *= 100.
                #print year_built
                #print 'energy current', eui
                #print 'energy target', energy_target
                #print energy_percent_reduction
            else:
                energy_target = float(mediansiteeui) * 0.2
                energy_percent_reduction = 1 - (energy_target/eui)
                val_energy_red = eui - energy_target
                #print 'after year 2002'
                #print year_built
                #print 'energy current', eui
                #print 'energy target', energy_target
                #print energy_percent_reduction
        except Exception as e:
            pass#print str(e)
        #print '---'
        
        
        dist2challenge_per.append(energy_percent_reduction)
        challenge_target.append(energy_target)
        dist2challenge_val.append(val_energy_red)
        general_types.append(gentype)

print 'num of total building', len(lstofbld)
print "number of missing", countofomit